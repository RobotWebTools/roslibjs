/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 *
 * Note to anyone reviewing this code: these functions are called
 * in the context of their parent object, unless bound
 * @fileOverview
 */

/** @type {any} */
import CBOR from 'cbor-js';
import typedArrayTagger from '../util/cborTypedArrayTags.js';
/** @type {any} */
var BSON = null;
// @ts-expect-error -- Workarounds for not including BSON in bundle. need to revisit
if (typeof bson !== 'undefined') {
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
 */
export default function SocketAdapter(/** @type {any} */ client) {
  /** @type {any} */
  var decoder = null;
  if (client.transportOptions.decoder) {
    decoder = client.transportOptions.decoder;
  }

  /**
   * Buffer Map for incoming message fragments
   * @type {Map<string, {fragments: Array<string>, received: number, total: number}>}
   */
  const fragmentBuffer = new Map();

  function handleMessage(/** @type {any} */ message) {
    if (message.op === 'fragment') {
      handleFragment(message);
      return;
    }
    if (message.op === 'publish') {
      client.emit(message.topic, message.msg);
    } else if (message.op === 'service_response') {
      client.emit(message.id, message);
    } else if (message.op === 'call_service') {
      client.emit(message.service, message);
    } else if (message.op === 'send_action_goal') {
      client.emit(message.action, message);
    } else if (message.op === 'cancel_action_goal') {
      client.emit(message.id, message);
    } else if (message.op === 'action_feedback') {
      client.emit(message.id, message);
    } else if (message.op === 'action_result') {
      client.emit(message.id, message);
    } else if (message.op === 'status') {
      if (message.id) {
        client.emit('status:' + message.id, message);
      } else {
        client.emit('status', message);
      }
    }
  }

  function handleFragment(/** @type {any} */ fragment) {
    const { id, data, num, total } = fragment;
    if (!id || typeof num !== 'number' || typeof total !== 'number' || typeof data !== 'string') {
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
      throw new Error('Fragment buffer entry missing for id: ' + id);
    }
    // Only accept fragments within the integer part of total
    if (num < totalInt) {
      if (typeof entry.fragments[num] === 'undefined') {
        entry.fragments[num] = data;
        entry.received++;
      }
    }
    // If all integer fragments received, reconstruct and process
    if (entry.received === totalInt) {
      const fullData = entry.fragments.join('');
      let message;
      try {
        message = JSON.parse(fullData);
      } catch (e) {
        // Failed to parse, ignore
        fragmentBuffer.delete(id);
        return;
      }
      fragmentBuffer.delete(id);
      handleMessage(message);
    }
  }

  function handlePng(/** @type {any} */ message, /** @type {any} */ callback) {
    if (message.op === 'png') {
      // If in Node.js..
      if (typeof window === 'undefined') {
        import('../util/decompressPng.js').then(({ default: decompressPng }) => decompressPng(message.data, callback));
      } else {
        // if in browser..
        import('../util/shim/decompressPng.js').then(({ default: decompressPng }) => decompressPng(message.data, callback));
      }
    } else {
      callback(message);
    }
  }

  function decodeBSON(/** @type {any} */ data, /** @type {any} */ callback) {
    if (!BSON) {
      throw 'Cannot process BSON encoded message without BSON header.';
    }
    var reader = new FileReader();
    reader.onload = function () {
      // @ts-expect-error -- this doesn't seem right, but don't want to break current type coercion assumption
      var uint8Array = new Uint8Array(this.result);
      var msg = BSON.deserialize(uint8Array);
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
      client.emit('connection', event);
    },

    /**
     * Emit a 'close' event on WebSocket disconnection.
     *
     * @param {function} event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onclose: function onClose(event) {
      client.isConnected = false;
      client.emit('close', event);
    },

    /**
     * Emit an 'error' event whenever there was an error.
     *
     * @param {function} event - The argument to emit with the event.
     * @memberof SocketAdapter
     */
    onerror: function onError(event) {
      client.emit('error', event);
    },

    /**
     * Parse message responses from rosbridge and send to the appropriate
     * topic, service, or param.
     *
     * @param {Object} data - The raw JSON message from rosbridge.
     * @memberof SocketAdapter
     */
    onmessage: function onMessage(/** @type {any} */ data) {
      if (decoder) {
        decoder(data.data, function (/** @type {any} */ message) {
          handleMessage(message);
        });
      } else if (typeof Blob !== 'undefined' && data.data instanceof Blob) {
        decodeBSON(data.data, function (/** @type {any} */ message) {
          handlePng(message, handleMessage);
        });
      } else if (data.data instanceof ArrayBuffer) {
        var decoded = CBOR.decode(data.data, typedArrayTagger);
        handleMessage(decoded);
      } else {
        var message = JSON.parse(typeof data === 'string' ? data : data.data);
        handlePng(message, handleMessage);
      }
    }
  };
}
