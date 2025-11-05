import CBOR from "cbor-js";
import typedArrayTagger from "../util/cborTypedArrayTags.js";
import {
  isRosbridgeFragmentMessage,
  isRosbridgePngMessage,
} from "../types/protocol.js";
let BSON = null;
// @ts-expect-error -- Workarounds for not including BSON in bundle. need to revisit
if (typeof bson !== "undefined") {
  // @ts-expect-error -- Workarounds for not including BSON in bundle. need to revisit
  BSON = bson().BSON;
}

/**
 * Socket adapter that provides unified event handling for WebSocket and RTCDataChannel.
 * Handles transport-level concerns like fragmentation, encoding/decoding, and delegates
 * message processing to provided callbacks.
 *
 * @class SocketAdapter
 */
export default class SocketAdapter {
  /**
   * @param {WebSocket|RTCDataChannel|import("ws").WebSocket} socket - The socket to attach event listeners to
   * @param {Object} options - Configuration options
   * @param {function(Event): void} options.onOpen - Callback for socket open events
   * @param {function(Event): void} options.onClose - Callback for socket close events
   * @param {function(Event): void} options.onError - Callback for socket error events
   * @param {function(import('../types/protocol.ts').RosbridgeMessage): void} options.onMessage - Callback for processed messages
   * @param {function(any, function): void} [options.decoder] - Optional decoder function
   */
  constructor(socket, options) {
    this.socket = socket;
    this.onOpenCallback = options.onOpen;
    this.onCloseCallback = options.onClose;
    this.onErrorCallback = options.onError;
    this.onMessageCallback = options.onMessage;
    this.decoder = options.decoder || null;

    /**
     * Buffer Map for incoming message fragments
     * @type {Map<string, {fragments: Array<string>, received: number, total: number}>}
     */
    this.fragmentBuffer = new Map();

    this.setupEventListeners();
  }

  /**
   * Set up event listeners on the socket
   * @private
   */
  setupEventListeners() {
    this.socket.onopen = (event) => this.onopen(event);
    this.socket.onclose = (event) => this.onclose(event);
    this.socket.onerror = (event) => this.onerror(event);
    this.socket.onmessage = (data) => this.onmessage(data);
  }

  /**
   * @param {import('../types/protocol.ts').RosbridgeMessage} message
   */
  handleMessage(message) {
    if (isRosbridgeFragmentMessage(message)) {
      this.handleFragment(message);
    } else {
      // Delegate message processing to the callback
      this.onMessageCallback(message);
    }
  }

  /**
   * @param {import('../types/protocol.ts').RosbridgeFragmentMessage} fragment
   */
  handleFragment(fragment) {
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
      throw new Error("Fragment buffer entry missing for id: " + id);
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
      let message;
      try {
        message = JSON.parse(fullData);
      } catch {
        // Failed to parse, ignore
        this.fragmentBuffer.delete(id);
        return;
      }
      this.fragmentBuffer.delete(id);
      this.handleMessage(message);
    }
  }

  /**
   * @param {import('../types/protocol.ts').RosbridgeMessage} message
   * @param {(message: import('../types/protocol.ts').RosbridgeMessage) => void} callback
   */
  handlePng(message, callback) {
    if (isRosbridgePngMessage(message)) {
      // If in Node.js..
      if (typeof window === "undefined") {
        import("../util/decompressPng.js").then(
          ({ default: decompressPng }) => {
            decompressPng(message.data, callback);
          },
        );
      } else {
        // if in browser..
        import("../util/shim/decompressPng.js").then(
          ({ default: decompressPng }) => {
            decompressPng(message.data, callback);
          },
        );
      }
    } else {
      callback(message);
    }
  }

  decodeBSON(data, callback) {
    if (!BSON) {
      throw "Cannot process BSON encoded message without BSON header.";
    }
    const reader = new FileReader();
    reader.onload = function () {
      // @ts-expect-error -- this doesn't seem right, but don't want to break current type coercion assumption
      const uint8Array = new Uint8Array(this.result);
      const msg = BSON.deserialize(uint8Array);
      callback(msg);
    };
    reader.readAsArrayBuffer(data);
  }

  /**
   * Send data through the socket
   * @param {string|ArrayBuffer|Blob} data - Data to send
   */
  send(data) {
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
   * @returns {number|string} The socket ready state
   */
  get readyState() {
    return this.socket.readyState;
  }

  /**
   * Handle socket open event.
   *
   * @param {Event} event - The open event
   * @memberof SocketAdapter
   */
  onopen(event) {
    this.onOpenCallback(event);
  }

  /**
   * Handle socket close event.
   *
   * @param {Event} event - The close event
   * @memberof SocketAdapter
   */
  onclose(event) {
    this.onCloseCallback(event);
  }

  /**
   * Handle socket error event.
   *
   * @param {Event} event - The error event
   * @memberof SocketAdapter
   */
  onerror(event) {
    this.onErrorCallback(event);
  }

  /**
   * Handle incoming socket message and decode it appropriately.
   *
   * @param {Object} data - The raw message data from the socket.
   * @memberof SocketAdapter
   */
  onmessage(data) {
    if (this.decoder) {
      this.decoder(data.data, (message) => {
        this.handleMessage(message);
      });
    } else if (typeof Blob !== "undefined" && data.data instanceof Blob) {
      this.decodeBSON(data.data, (message) => {
        this.handlePng(message, this.handleMessage.bind(this));
      });
    } else if (data.data instanceof ArrayBuffer) {
      const decoded = CBOR.decode(data.data, typedArrayTagger);
      this.handleMessage(decoded);
    } else {
      const message = JSON.parse(typeof data === "string" ? data : data.data);
      this.handlePng(message, this.handleMessage.bind(this));
    }
  }
}
