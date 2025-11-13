import EventEmitter from "eventemitter3";
import type {
  RosbridgePngMessage,
  RosbridgeMessage,
  RosbridgeFragmentMessage,
} from "../types/protocol.js";
import {
  isRosbridgeFragmentMessage,
  isRosbridgeMessage,
  isRosbridgePngMessage,
} from "../types/protocol.js";
import * as ws from "ws";
import { deserialize } from "bson";
import CBOR from "cbor-js";
import typedArrayTagger from "../util/cborTypedArrayTags.js";
import decompressPng from "../util/decompressPng.js";

/**
 * Because transport implementations may have different event types
 * with varying amounts of information, and we want to be a pass-through
 * of such information, we can't exactly define the event types here.
 */
export type TransportEvent = unknown;

export interface ITransport {
  on(
    event: "open" | "close" | "error",
    listener: (event: TransportEvent) => void,
  ): this;

  on(event: "message", listener: (message: RosbridgeMessage) => void): this;

  send(message: RosbridgeMessage): void;

  close(): void;

  isConnecting(): boolean;
  isOpen(): boolean;
  isClosing(): boolean;
  isClosed(): boolean;
}

export interface ITransportFactory {
  createTransport(url: string): Promise<ITransport>;
}

export abstract class AbstractTransport
  extends EventEmitter<{
    open: [TransportEvent];
    close: [TransportEvent];
    error: [TransportEvent];
    message: [RosbridgeMessage];
  }>
  implements ITransport
{
  /**
   * Buffer Map for incoming message fragments.
   */
  #fragmentBuffer = new Map<
    RosbridgeFragmentMessage["id"],
    {
      fragments: string[];
      received: number;
      total: number;
    }
  >();

  abstract send(message: RosbridgeMessage): void;
  abstract close(): void;
  abstract isConnecting(): boolean;
  abstract isOpen(): boolean;
  abstract isClosing(): boolean;
  abstract isClosed(): boolean;

  /**
   * Decodes a raw message received from the transport
   * and emits it as a RosbridgeMessage over the "message" event.
   *
   * The default implementation handles multiple compression formats
   * and fragment messages. Subclasses may override this method to provide
   * custom handling of raw messages and when to emit messages.
   */
  protected handleRawMessage(data: unknown): void {
    if (isRosbridgeMessage(data)) {
      this.handleRosbridgeMessage(data);
    } else if (typeof Blob !== "undefined" && data instanceof Blob) {
      this.handleBsonMessage(data);
    } else if (data instanceof ArrayBuffer) {
      this.handleCborMessage(data);
    } else {
      this.handleJsonMessage(String(data));
    }
  }

  /**
   * Handles a RosbridgeMessage.
   * If the message is a fragment, it is appended to the fragment buffer.
   * If the message is a PNG, it is decompressed and reprocessed.
   * Otherwise, the message is emitted.
   */
  private handleRosbridgeMessage(message: RosbridgeMessage) {
    if (isRosbridgeFragmentMessage(message)) {
      this.handleRosbridgeFragmentMessage(message);
    } else if (isRosbridgePngMessage(message)) {
      this.handleRosbridgePngMessage(message);
    } else {
      this.emit("message", message);
    }
  }

  /**
   * Appends a fragment to the current fragment buffer for the message id.
   * If all fragments are received, the message is reconstructed and processed.
   */
  private handleRosbridgeFragmentMessage(fragment: RosbridgeFragmentMessage) {
    const { id, data, num, total } = fragment;
    if (
      !id ||
      typeof num !== "number" ||
      typeof total !== "number" ||
      typeof data !== "string"
    ) {
      // Invalid fragment, ignore
      return;
    }
    // If total is a float, use its integer part for fragment count
    const totalInt = Math.floor(total);
    if (!this.#fragmentBuffer.has(id)) {
      this.#fragmentBuffer.set(id, {
        fragments: [],
        received: 0,
        total: totalInt,
      });
    }
    const entry = this.#fragmentBuffer.get(id);

    if (!entry) {
      // Should not happen, signal error
      throw new Error(`Fragment buffer entry missing for id: ${id}`);
    }
    // Only accept fragments within the integer part of total
    if (num < totalInt) {
      if (typeof entry.fragments[num] === "undefined") {
        entry.fragments[num] = data;
        entry.received++;
      }
    }
    // If all integer fragments received, reconstruct and process
    if (entry.received === totalInt) {
      const fullData = entry.fragments.join("");
      let message: unknown;
      try {
        message = JSON.parse(fullData);
      } catch {
        // Failed to parse, ignore
        this.#fragmentBuffer.delete(id);
        return;
      }
      this.#fragmentBuffer.delete(id);
      if (isRosbridgeMessage(message)) {
        this.handleRosbridgeMessage(message);
      } else {
        throw new Error("Received invalid rosbridge message!");
      }
    }
  }

  /**
   * Decompresses a PNG image expecting the result to be a RosbridgeMessage.
   * It is one technique for compressing JSON data.
   */
  private handleRosbridgePngMessage(message: RosbridgePngMessage) {
    const decoded = decompressPng(message.data);
    if (isRosbridgeMessage(decoded)) {
      this.handleRosbridgeMessage(decoded);
    } else {
      throw new Error("Decompressed PNG data was invalid!");
    }
  }

  /**
   * Deserializes a Blob of BSON expecting the result to be a RosbridgeMessage.
   * It is one technique for compressing JSON data.
   */
  private handleBsonMessage(bson: Blob) {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(reader.result);
        const data: unknown = deserialize(uint8Array);
        if (isRosbridgeMessage(data)) {
          this.handleRosbridgeMessage(data);
        } else {
          throw new Error("Decoded BSON data was invalid!");
        }
      }
    };
    reader.readAsArrayBuffer(bson);
  }

  /**
   * Deserializes an ArrayBuffer of CBOR expecting the result to be a RosbridgeMessage.
   * It is one technique for compressing JSON data.
   */
  private handleCborMessage(cbor: ArrayBuffer) {
    const data: unknown = CBOR.decode(cbor, typedArrayTagger);
    if (isRosbridgeMessage(data)) {
      this.handleRosbridgeMessage(data);
    } else {
      throw new Error("Decoded CBOR data was invalid!");
    }
  }

  /**
   * Deserializes a JSON string expecting the result to be a RosbridgeMessage.
   */
  private handleJsonMessage(json: string) {
    const message: unknown = JSON.parse(json);
    if (isRosbridgeMessage(message)) {
      this.handleRosbridgeMessage(message);
    } else {
      throw new Error("Received invalid rosbridge message!");
    }
  }
}

export class NativeWebSocketTransport extends AbstractTransport {
  private socket: WebSocket;

  constructor(socket: WebSocket) {
    super();
    this.socket = socket;
    this.registerEventListeners();
  }

  public send(message: RosbridgeMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  public close(): void {
    this.socket.close();
  }

  public isConnecting(): boolean {
    return this.socket.readyState === WebSocket.CONNECTING;
  }

  public isOpen(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  public isClosing(): boolean {
    return this.socket.readyState === WebSocket.CLOSING;
  }

  public isClosed(): boolean {
    return this.socket.readyState === WebSocket.CLOSED;
  }

  private registerEventListeners(): void {
    this.socket.onopen = (event: Event) => {
      this.emit("open", event);
    };

    this.socket.onclose = (event: CloseEvent) => {
      this.emit("close", event);
    };

    this.socket.onerror = (event: Event) => {
      this.emit("error", event);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.handleRawMessage(event.data);
    };
  }
}

export class WsWebSocketTransport extends AbstractTransport {
  private socket: ws.WebSocket;

  constructor(socket: ws.WebSocket) {
    super();
    this.socket = socket;
    this.registerEventListeners();
  }

  public send(message: RosbridgeMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  public close(): void {
    this.socket.close();
  }

  public isConnecting(): boolean {
    return this.socket.readyState === ws.WebSocket.CONNECTING;
  }

  public isOpen(): boolean {
    return this.socket.readyState === ws.WebSocket.OPEN;
  }

  public isClosing(): boolean {
    return this.socket.readyState === ws.WebSocket.CLOSING;
  }

  public isClosed(): boolean {
    return this.socket.readyState === ws.WebSocket.CLOSED;
  }

  private registerEventListeners(): void {
    this.socket.onopen = (event: ws.Event) => {
      this.emit("open", event);
    };

    this.socket.onclose = (event: ws.CloseEvent) => {
      this.emit("close", event);
    };

    this.socket.onerror = (event: ws.ErrorEvent) => {
      this.emit("error", event);
    };

    this.socket.onmessage = (event: ws.MessageEvent) => {
      this.handleRawMessage(event.data);
    };
  }
}

/**
 * A transport factory that uses WebSockets to send and receive messages.
 * Will use the native `WebSocket` class if available, otherwise falls back
 * to the `ws` package.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 * @see https://github.com/websockets/ws
 */
export class WebSocketTransportFactory implements ITransportFactory {
  public async createTransport(url: string): Promise<ITransport> {
    // Browsers, Deno, Bun, and Node 22+ support WebSockets natively
    if (typeof WebSocket === "function") {
      const socket = new WebSocket(url);
      socket.binaryType = "arraybuffer";
      return new NativeWebSocketTransport(socket);
    }

    // If in Node.js, import ws to replace WebSocket API
    const ws = await import("ws");
    const socket = new ws.WebSocket(url);
    socket.binaryType = "arraybuffer";
    return new WsWebSocketTransport(socket);
  }
}
