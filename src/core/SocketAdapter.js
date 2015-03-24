/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 *
 * Note to anyone reviewing this code: these functions are called
 * in the context of their parent object, unless bound
 */
'use strict';

var Canvas = require('canvas');
var Image = Canvas.Image || global.Image;
var WebSocket = require('ws');

/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function places the
 * "image" in a canvas element then decodes the * "image" as a Base64 string.
 *
 * @param data - object containing the PNG data.
 * @param callback - function with params:
 *   * data - the uncompressed data
 */
function decompressPng(data, callback) {
  // Uncompresses the data before sending it through (use image/canvas to do so).
  var image = new Image();
  // When the image loads, extracts the raw data (JSON message).
  image.onload = function() {
    // Creates a local canvas to draw on.
    var canvas = new Canvas();
    var context = canvas.getContext('2d');

    // Sets width and height.
    canvas.width = image.width;
    canvas.height = image.height;

    // Prevents anti-aliasing and loosing data
    context.imageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;

    // Puts the data into the image.
    context.drawImage(image, 0, 0);
    // Grabs the raw, uncompressed data.
    var imageData = context.getImageData(0, 0, image.width, image.height).data;

    // Constructs the JSON.
    var jsonData = '';
    for (var i = 0; i < imageData.length; i += 4) {
      // RGB
      jsonData += String.fromCharCode(imageData[i], imageData[i + 1], imageData[i + 2]);
    }
    callback(JSON.parse(jsonData));
  };
  // Sends the image data to load.
  image.src = 'data:image/png;base64,' + data.data;
}

/**
 * Events listeners for a WebSocket or TCP socket to a JavaScript
 * ROS Client. Sets up Messages for a given topic to trigger an
 * event on the ROS client.
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
     */
    onopen: function onOpen(event) {
      client.isConnected = true;
      client.emit('connection', event);
    },

    /**
     * Emits a 'close' event on WebSocket disconnection.
     *
     * @param event - the argument to emit with the event.
     */
    onclose: function onClose(event) {
      client.isConnected = false;
      client.emit('close', event);
    },

    /**
     * Emits an 'error' event whenever there was an error.
     *
     * @param event - the argument to emit with the event.
     */
    onerror: function onError(event) {
      client.emit('error', event);
    },

    /**
     * Parses message responses from rosbridge and sends to the appropriate
     * topic, service, or param.
     *
     * @param message - the raw JSON message from rosbridge.
     */
    onmessage: function onMessage(message) {
      var data = JSON.parse(typeof message === 'string' ? message : message.data);
      if (data.op === 'png') {
        decompressPng(data, handleMessage);
      } else {
        handleMessage(data);
      }
    }
  };
}

module.exports = SocketAdapter;
