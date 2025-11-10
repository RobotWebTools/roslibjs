import CBOR from "cbor-js";
import typedArrayTagger from "../util/cborTypedArrayTags.js";
import type {
  RosbridgeFragmentMessage,
  RosbridgeMessage,
} from "../types/protocol.js";
import {
  isRosbridgeFragmentMessage,
  isRosbridgeMessage,
  isRosbridgePngMessage,
} from "../types/protocol.js";
import { deserialize } from "bson";
import type { WebSocket as WsWebSocket } from "ws";

export type RequiredSocketInterface = Pick<
  WebSocket | RTCDataChannel | WsWebSocket,
  | "onmessage"
  | "onclose"
  | "onerror"
  | "onopen"
  | "readyState"
  | "send"
  | "close"
>;

/**
 * A decoder provides custom decoding logic for socket messages.
 * The primary use case is for RTC data channel sockets.
 */
type Decoder = (
  /**
   * The raw message data from the socket.
   */
  data: unknown,
  /**
   * Invoked with the decoded RosbridgeMessage object.
   */
  callback: (message: RosbridgeMessage) => void,
) => void;

/**
 * Not all runtimes will have native WebSocket classes or
 * using the 'ws' package, so can't reliably reference them
 * so created our own enum for type safety.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/readyState
 */
enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * Not all runtimes will have native WebSocket classes or
 * using the 'ws' package, so can't reliably reference them
 * so created our own enum for type safety.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
 * https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/readyState
 */
enum RTCDataChannelReadyState {
  CONNECTING = "connecting",
  OPEN = "open",
  CLOSING = "closing",
  CLOSED = "closed",
}

/**
 * Socket adapter that provides unified event handling for WebSocket and RTCDataChannel.
 * Handles transport-level concerns like fragmentation, encoding/decoding, and delegates
 * message processing to provided callbacks.
 *
 * @class SocketAdapter
 */
export default class SocketAdapter {
  onOpenCallback: (event: Event) => void;
  onCloseCallback: (event: Event) => void;
  onErrorCallback: (event: ErrorEvent) => void;
  onMessageCallback: (message: RosbridgeMessage) => void;
  decoder: Decoder | null;
  /**
   * Buffer Map for incoming message fragments
   */
  private fragmentBuffer = new Map<
    string,
    { fragments: string[]; received: number; total: number }
  >();
  /**
   * @param socket - The socket to attach event listeners to
   * @param options - Configuration options
   * @param options.onOpen - Callback for socket open events
   * @param options.onClose - Callback for socket close events
   * @param options.onError - Callback for socket error events
   * @param options.onMessage - Callback for processed messages
   * @param [options.decoder] - Optional decoder function
   */
  constructor(
    private socket: RequiredSocketInterface,
    {
      onOpen,
      onClose,
      onError,
      onMessage,
      decoder = null,
    }: {
      onOpen: (event: Event) => void;
      onClose: (event: Event) => void;
      onError: (event: ErrorEvent | RTCErrorEvent) => void;
      onMessage: (message: RosbridgeMessage) => void;
      decoder?: Decoder | null;
    },
  ) {
    this.onOpenCallback = onOpen;
    this.onCloseCallback = onClose;
    this.onErrorCallback = onError;
    this.onMessageCallback = onMessage;
    this.decoder = decoder;

    this.socket.onopen = (e: Event) => {
      onOpen(e);
    };
    this.socket.onclose = (e: Event) => {
      onClose(e);
    };
    this.socket.onerror = (e: ErrorEvent | RTCErrorEvent) => {
      onError(e);
    };
    this.socket.onmessage = (e: MessageEvent) => {
      this.onmessage(e);
    };
  }

  handleMessage(message: RosbridgeMessage) {
    if (isRosbridgeFragmentMessage(message)) {
      this.handleFragment(message);
    } else {
      // Delegate message processing to the callback
      this.onMessageCallback(message);
    }
  }

  handleFragment(fragment: RosbridgeFragmentMessage) {
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
    if (!this.fragmentBuffer.has(id)) {
      this.fragmentBuffer.set(id, {
        fragments: [],
        received: 0,
        total: totalInt,
      });
    }
    const entry = this.fragmentBuffer.get(id);

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
        this.fragmentBuffer.delete(id);
        return;
      }
      this.fragmentBuffer.delete(id);
      if (isRosbridgeMessage(message)) {
        this.handleMessage(message);
      } else {
        throw new Error("Received invalid rosbridge message!");
      }
    }
  }

  handlePng(
    message: RosbridgeMessage,
    callback: (message: RosbridgeMessage) => void,
  ) {
    if (isRosbridgePngMessage(message)) {
      const pngCallback = (data: unknown) => {
        if (isRosbridgeMessage(data)) {
          callback(data);
        } else {
          throw new Error("Decompressed PNG data was invalid!");
        }
      };
      // If in Node.js..
      if (typeof window === "undefined") {
        import("../util/decompressPng.js")
          .then(({ default: decompressPng }) => {
            decompressPng(message.data, pngCallback);
          })
          .catch(console.error);
      } else {
        // if in browser..
        import("../util/shim/decompressPng.js")
          .then(({ default: decompressPng }) => {
            decompressPng(message.data, pngCallback);
          })
          .catch(console.error);
      }
    } else {
      callback(message);
    }
  }

  decodeBSON(data: Blob, callback: (msg: RosbridgeMessage) => void) {
    const reader = new FileReader();
    reader.onload = function () {
      if (this.result instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(this.result);
        const msg: unknown = deserialize(uint8Array);
        if (isRosbridgeMessage(msg)) {
          callback(msg);
        } else {
          console.error("Invalid BSON message", msg);
        }
      }
    };
    reader.readAsArrayBuffer(data);
  }

  /**
   * Send data through the socket
   */
  send(data: string | ArrayBuffer | Blob) {
    if (this.isOpen()) {
      // @ts-expect-error -- WebSocket and RTCDataChannel have compatible send methods in practice
      this.socket.send(data);
    }
  }

  /**
   * Close the socket connection
   */
  close() {
    this.socket.close();
  }

  /**
   * Get the current connection state
   * @returns The socket ready state
   */
  get readyState(): RequiredSocketInterface["readyState"] {
    return this.socket.readyState;
  }

  isConnecting(): boolean {
    return (
      this.readyState === WebSocketReadyState.CONNECTING ||
      this.readyState === RTCDataChannelReadyState.CONNECTING
    );
  }

  isOpen(): boolean {
    return (
      this.readyState === WebSocketReadyState.OPEN ||
      this.readyState === RTCDataChannelReadyState.OPEN
    );
  }

  isClosing(): boolean {
    return (
      this.readyState === WebSocketReadyState.CLOSING ||
      this.readyState === RTCDataChannelReadyState.CLOSING
    );
  }

  isClosed(): boolean {
    return (
      this.readyState === WebSocketReadyState.CLOSED ||
      this.readyState === RTCDataChannelReadyState.CLOSED
    );
  }

  /**
   * Handle incoming socket message and decode it appropriately.
   *
   * @param data - The raw message data from the socket.
   */
  onmessage(data: MessageEvent) {
    if (this.decoder) {
      this.decoder(data.data, (message) => {
        this.handleMessage(message);
      });
    } else if (typeof Blob !== "undefined" && data.data instanceof Blob) {
      this.decodeBSON(data.data, (message) => {
        this.handlePng(message, (msg) => {
          this.handleMessage(msg);
        });
      });
    } else if (data.data instanceof ArrayBuffer) {
      const decoded = CBOR.decode(data.data, typedArrayTagger);
      if (isRosbridgeMessage(decoded)) {
        this.handleMessage(decoded);
      } else {
        throw new Error("Received invalid rosbridge message!");
      }
    } else {
      const message: unknown = JSON.parse(
        String(typeof data === "string" ? data : data.data),
      );

      if (isRosbridgeMessage(message)) {
        this.handlePng(message, (msg) => {
          this.handleMessage(msg);
        });
      } else {
        throw new Error("Received invalid rosbridge message!");
      }
    }
  }
}
