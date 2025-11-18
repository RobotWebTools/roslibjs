import { EventEmitter } from "eventemitter3";
import type {
  RosbridgePngMessage,
  RosbridgeMessage,
  RosbridgeFragmentMessage,
  RosbridgeMessageBase,
} from "../../types/protocol.ts";
import {
  isRosbridgeFragmentMessage,
  isRosbridgeMessage,
  isRosbridgePngMessage,
} from "../../types/protocol.ts";
import { deserialize } from "bson";
import { decode } from "cbor2";
import decompressPng from "../../util/decompressPng.ts";

/**
 * Because transport implementations may have different event types
 * with varying amounts of information, and we want to be a pass-through
 * of such information, we can't exactly define the event types here.
 */
export type TransportEvent = unknown;

/**
 * Abstraction responsible for sending and receiving messages
 * between the client and the rosbridge server.
 *
 * Inspired by the WebSocket API, which is the default reference implementation.
 */
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

/**
 * Invoked when the roslib needs a new transport, such as
 * when (re)connecting to the rosbridge server.
 */
export type ITransportFactory = (url: string) => Promise<ITransport>;

/**
 * Abstract base class for all transport implementations.
 * Provides a default implementation for decoding raw rosbridge messages.
 */
export abstract class AbstractTransport
  extends EventEmitter<{
    open: [TransportEvent];
    close: [TransportEvent];
    error: [TransportEvent];
    message: [RosbridgeMessageBase];
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
   * If an error occurs, it is emitted as an "error" event.
   *
   * The default implementation handles multiple compression formats
   * and fragment messages. Subclasses may override this method to provide
   * custom handling of raw messages and when to emit messages.
   */
  protected handleRawMessage(data: unknown): void {
    try {
      if (isRosbridgeMessage(data)) {
        this.handleRosbridgeMessage(data);
      } else if (typeof Blob !== "undefined" && data instanceof Blob) {
        this.handleBsonMessage(data);
      } else if (data instanceof ArrayBuffer) {
        this.handleCborMessage(data);
      } else {
        this.handleJsonMessage(String(data));
      }
    } catch (error) {
      this.emit("error", error);
    }
  }

  /**
   * Handles a RosbridgeMessage.
   * If the message is a fragment, it is appended to the fragment buffer.
   * If the message is a PNG, it is decompressed and reprocessed.
   * Otherwise, the message is emitted.
   */
  private handleRosbridgeMessage(message: RosbridgeMessageBase) {
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
      } catch (error) {
        throw new Error("Fragments did not form a valid JSON message!", {
          cause: error,
        });
      } finally {
        this.#fragmentBuffer.delete(id);
      }
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
          this.emit("error", new Error("Decoded BSON data was invalid!"));
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
    const data: unknown = decode(new Uint8Array(cbor));
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
