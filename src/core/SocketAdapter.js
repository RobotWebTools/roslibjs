/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 *
 * Note to anyone reviewing this code: these functions are called
 * in the context of their parent object, unless bound
 * @fileOverview
 */

import CBOR from 'cbor-js';
import typedArrayTagger from '../util/cborTypedArrayTags.js';
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
export default function SocketAdapter(client) {
  var decoder = null;
  if (client.transportOptions.decoder) {
    decoder = client.transportOptions.decoder;
  }

  function handleMessage(message) {
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

  function handlePng(message, callback) {
    if (message.op === 'png') {
      // If in Node.js..
      if (typeof window === 'undefined') {
        import('../util/decompressPng.js').then(({ default: decompressPng }) => decompressPng(message.data, callback));
      } else {
        // if in browser..
        import('../util/shim/decompressPng.js').then(({default: decompressPng}) => decompressPng(message.data, callback));
      }
    } else {
      callback(message);
    }
  }

  function decodeBSON(data, callback) {
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
    onmessage: function onMessage(data) {
      if (decoder) {
        decoder(data.data, function (message) {
          handleMessage(message);
        });
      } else if (typeof Blob !== 'undefined' && data.data instanceof Blob) {
        decodeBSON(data.data, function (message) {
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
