var ws = require('nodejs-websocket');

/**
 * Provides a WebSocket browser compatible interface to the nodejs-websocket client library. This is used by ROSLIB.Ros directly.
 *
 * @constructor
 */
var WebSocket = function(url) {
	this.url = url;
	this.onopen = function() {}; // placeholder function
	this.onclose = function() {}; // placeholder function
	this.onerror = function() {}; // placeholder function
	this.onmessage = function() {}; // placeholder function
	var that = this;
	this.wsconn = ws.connect(url, null, function(evt) {
		that.readyState = that.wsconn.readyState;
		// call onopen
		that.onopen(evt); // TODO check compatible
	});
	this.wsconn.on('close', function(evt) {
		that.readyState = that.wsconn.readyState;
		that.onclose(evt);
	});
	this.wsconn.on('error', function(evt) {
		that.readyState = that.wsconn.readyState;
		that.onerror(evt);
	});
	this.wsconn.on('text', function(fb) {
		that.readyState = that.wsconn.readyState;
		// do something with framebuffer
		that.onmessage({
			data: fb
		});
	});
	this.wsconn.on('binary', function(fb) {
		that.readyState = that.wsconn.readyState;
		// do something with framebuffer - rosbridge wraps binary in the JSON under the data property
		// Thus this function should not be needed - we can safely ignore binary messages
	});
};
WebSocket.prototype.close = function() {
	this.wsconn.close();
};
WebSocket.prototype.send = function(messageJson) {
	this.wsconn.sendText(messageJson);
};
// Copied from https://github.com/sitegui/nodejs-websocket/blob/master/Connection.js#L75-L78
WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

module.exports = WebSocket;