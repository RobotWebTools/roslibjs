import CBOR from "cbor-js";
import typedArrayTagger from "../util/cborTypedArrayTags.js";
import {
  isRosbridgeFragmentMessage,
  isRosbridgeMessage,
  isRosbridgePngMessage,
  RosbridgeFragmentMessage,
  RosbridgeMessage,
} from "../types/protocol.js";
import { deserialize } from "bson";

export type RequiredSocketInterface = Pick<
  WebSocket | RTCDataChannel | import("ws").WebSocket,
  | "onmessage"
  | "onclose"
  | "onerror"
  | "onopen"
  | "readyState"
  | "send"
  | "close"
>;

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
  decoder:
    | ((data: unknown, callback: (message: RosbridgeMessage) => void) => void)
    | null;
  /**
   * Buffer Map for incoming message fragments
   */
  fragmentBuffer = new Map<
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
      onError: (event: ErrorEvent) => void;
      onMessage: (message: RosbridgeMessage) => void;
      decoder?: ((data, callback: (error, result) => void) => void) | null;
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
    this.socket.onerror = (e: ErrorEvent) => {
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
      // If in Node.js..
      if (typeof window === "undefined") {
        import("../util/decompressPng.js")
          .then(({ default: decompressPng }) => {
            decompressPng(message.data, callback);
          })
          .catch(console.error);
      } else {
        // if in browser..
        import("../util/shim/decompressPng.js")
          .then(({ default: decompressPng }) => {
            decompressPng(message.data, callback);
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
    // Check readyState for both WebSocket and RTCDataChannel
    const isOpen =
      this.socket.readyState === 1 || // WebSocket.OPEN
      this.socket.readyState === "open"; // RTCDataChannel 'open'
    if (isOpen) {
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
  get readyState(): number | string {
    return this.socket.readyState;
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
