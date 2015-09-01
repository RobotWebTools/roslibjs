/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 *
 * Note to anyone reviewing this code: these functions are called
 * in the context of their parent object, unless bound
 * @fileOverview
 */
'use strict';

var decompressPng = require('../util/decompressPng');
var WebSocket = require('ws');
var BSON = null;
if(typeof bson !== 'undefined'){
    BSON = bson().BSON;
}

/**
 * Events listeners for a WebSocket or TCP socket to a JavaScript
 * ROS Client. Sets up Messages for a given topic to trigger an
 * event on the ROS client.
 * 
 * @namespace SocketAdapter
 * @private
 */
function SocketAdapter(client) {
  function handleMessage(message) {
    if (message.op === 'publish') {
      client.emit(message.topic, message.msg);
    } else if (message.op === 'service_response') {
      client.emit(message.id, message);
    }
  }

  return {
    /**
     * Emits a 'connection' event on WebSocket connection.
     *
     * @param event - the argument to emit with the event.
     * @memberof SocketAdapter
     */
    onopen: function onOpen(event) {
      client.isConnected = true;
      client.emit('connection', event);
    },

    /**
     * Emits a 'close' event on WebSocket disconnection.
     *
     * @param event - the argument to emit with the event.
     * @memberof SocketAdapter
     */
    onclose: function onClose(event) {
      client.isConnected = false;
      client.emit('close', event);
    },

    /**
     * Emits an 'error' event whenever there was an error.
     *
     * @param event - the argument to emit with the event.
     * @memberof SocketAdapter
     */
    onerror: function onError(event) {
      client.emit('error', event);
    },

    /**
     * Parses message responses from rosbridge and sends to the appropriate
     * topic, service, or param.
     *
     * @param message - the raw JSON message from rosbridge.
     * @memberof SocketAdapter
     */
    onmessage: function onMessage(message) {
      if(typeof Blob !== 'undefined' && message.data instanceof Blob) {
        if(!BSON){
            throw 'Cannot process BSON encoded message without BSON header.';
        }
        var reader = new FileReader();
        reader.onload  = function() {
          var uint8Array = new Uint8Array(this.result);
          var msg = BSON.deserialize(uint8Array);

          if (msg.op === 'png') {
              decompressPng(msg, handleMessage);
          } else {
              handleMessage(msg);
          }
        };
        reader.readAsArrayBuffer(message.data);
      } else {
        var data = JSON.parse(typeof message === 'string' ? message : message.data);
        if (data.op === 'png') {
          decompressPng(data, handleMessage);
        } else {
          handleMessage(data);
        }
      }
    }
  };
}

module.exports = SocketAdapter;
