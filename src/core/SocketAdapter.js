/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 *
 * Note to anyone reviewing this code: these functions are called
 * in the context of their parent object, unless bound
 * @fileOverview
 */

import CBOR from "cbor-js";
import typedArrayTagger from "../util/cborTypedArrayTags.js";
import {
  isRosbridgeActionFeedbackMessage,
  isRosbridgeActionResultMessage,
  isRosbridgeCallServiceMessage,
  isRosbridgeCancelActionGoalMessage,
  isRosbridgeFragmentMessage,
  isRosbridgePngMessage,
  isRosbridgePublishMessage,
  isRosbridgeSendActionGoalMessage,
  isRosbridgeServiceResponseMessage,
  isRosbridgeStatusMessage,
} from "../types/protocol.js";
let BSON = null;
// @ts-expect-error -- Workarounds for not including BSON in bundle. need to revisit
if (typeof bson !== "undefined") {
  // @ts-expect-error -- Workarounds for not including BSON in bundle. need to revisit
  BSON = bson().BSON;
}

/**
 * Event listeners for a WebSocket or TCP socket to a JavaScript
 * ROS Client. Sets up Messages for a given topic to trigger an
 * event on the ROS client.
 *
 * @namespace SocketAdapter
 * @private
 * @param {import('./Ros.js').default} client
 */
export default function SocketAdapter(client) {
  let decoder = null;
  if (client.transportOptions.decoder) {
    decoder = client.transportOptions.decoder;
  }

  /**
   * Buffer Map for incoming message fragments
   * @type {Map<string, {fragments: Array<string>, received: number, total: number}>}
   */
  const fragmentBuffer = new Map();

  /**
   * @param {import('../types/protocol.ts').RosbridgeMessage} message
   */
  function handleMessage(message) {
    if (isRosbridgeFragmentMessage(message)) {
      handleFragment(message);
    } else if (isRosbridgePublishMessage(message)) {
      client.emit(message.topic, message.msg);
    } else if (isRosbridgeServiceResponseMessage(message)) {
      if (message.id) {
        client.emit(message.id, message);
      } else {
        console.error("Received service response without ID");
      }
    } else if (isRosbridgeCallServiceMessage(message)) {
      client.emit(message.service, message);
    } else if (isRosbridgeSendActionGoalMessage(message)) {
      client.emit(message.action, message);
    } else if (isRosbridgeCancelActionGoalMessage(message)) {
      client.emit(message.id, message);
    } else if (isRosbridgeActionFeedbackMessage(message)) {
      client.emit(message.id, message);
    } else if (isRosbridgeActionResultMessage(message)) {
      client.emit(message.id, message);
    } else if (isRosbridgeStatusMessage(message)) {
      if (message.id) {
        client.emit("status:" + message.id, message);
      } else {
        client.emit("status", message);
      }
    }
  }

  /**
   * @param {import('../types/protocol.ts').RosbridgeFragmentMessage} fragment
   */
  function handleFragment(fragment) {
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
    if (!fragmentBuffer.has(id)) {
      fragmentBuffer.set(id, { fragments: [], received: 0, total: totalInt });
    }
    const entry = fragmentBuffer.get(id);

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
        fragmentBuffer.delete(id);
        return;
      }
      fragmentBuffer.delete(id);
      handleMessage(message);
    }
  }

  /**
   * @param {import('../types/protocol.ts').RosbridgeMessage} message
   * @param {(message: import('../types/protocol.ts').RosbridgeMessage) => void} callback
   */
  function handlePng(message, callback) {
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

  function decodeBSON(data, callback) {
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

  return {
    /**
     * Emit a 'connection' event on WebSocket connection.
     *
     * @param {function} event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onopen: function onOpen(event) {
      client.isConnected = true;
      client.emit("connection", event);
    },

    /**
     * Emit a 'close' event on WebSocket disconnection.
     *
     * @param {function} event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onclose: function onClose(event) {
      client.isConnected = false;
      client.emit("close", event);
    },

    /**
     * Emit an 'error' event whenever there was an error.
     *
     * @param {function} event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onerror: function onError(event) {
      client.emit("error", event);
    },

    /**
     * Parse message responses from rosbridge and send to the appropriate
     * topic, service, or param.
     *
     * @param {Object} data - The raw JSON message from rosbridge.
     * @memberof SocketAdapter
     */
    onmessage: function onMessage(data) {
      if (decoder) {
        decoder(data.data, function (message) {
          handleMessage(message);
        });
      } else if (typeof Blob !== "undefined" && data.data instanceof Blob) {
        decodeBSON(data.data, function (message) {
          handlePng(message, handleMessage);
        });
      } else if (data.data instanceof ArrayBuffer) {
        const decoded = CBOR.decode(data.data, typedArrayTagger);
        handleMessage(decoded);
      } else {
        const message = JSON.parse(typeof data === "string" ? data : data.data);
        handlePng(message, handleMessage);
      }
    },
  };
}
