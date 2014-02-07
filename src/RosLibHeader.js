/**
 * @author Jihoon Lee - jihoonlee.in@gmail.com
 */
/**
 * Nodejs compatible version of RosLibjs. It has adopted some code from Adam Fowler(adam.fowler@gmail.com)'s fork.
 */


/**
 * @author Adam Fowler - adam.fowler@gmail.com
 */

/**
 * Acts as the main registration function for using RosLibJS in Node.js. Keeps Node.js specific code outside of the roslibjs code files.
 *
 * This class provides a constructor for a new Node.js object:-
 * var ROSLIB = require("roslibjs")
 * var ros = new ROSLIB.Ros(...);
 * Now use the same as you would in the browser
 */

var EventEmitter2 = require('eventemitter2').EventEmitter2; // direct import as eventemitter2 is a node.js module also - TODO Test direct import works
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
  this.wsconn = ws.connect(url,null,function(evt) {
    that.readyState = that.wsconn.readyState;
    
    // call onopen
    that.onopen(evt); // TODO check compatible
  });
  
  this.wsconn.on('close', function(evt) {
    that.readyState = that.wsconn.readyState;
    
    that.onclose(evt);
  });
  this.wsconn.on('error',function(evt) {
    that.readyState = that.wsconn.readyState;
    
    that.onerror(evt);
  });
  this.wsconn.on('text',function(fb) {
    that.readyState = that.wsconn.readyState;
    
    // do something with framebuffer
    
    // assume RosBridge JSON and parse
    var json = JSON.parse(fb);
    
    that.onmessage(json);
  });
  this.wsconn.on('binary',function(fb) {
    that.readyState = that.wsconn.readyState;
    
    // do something with framebuffer - rosbridge wraps binary in the JSON under the data property
    // Thus this function should not be needed - we can safely ignore binary messages
  });
};

WebSocket.prototype.close = function() {
  this.wsconn.close();
};

WebSocket.prototype.send = function(messageJson) {
  this.wsconn.sendText(JSON.stringify(messageJson));
};

/*
 * NOTE AFTER THIS ALL CODE IS COPIED IN FOR NODE.JS FROM CLIENT FILES TO CREATE roslibjs.js (A Node npm usable module)
 *
 * E.g. RosLib.js, Ros.js, Topic.js etc. are all cat'ed into this file
 *
 * After these are cat'ed in, the RosLibNode-overrides.js file is cat'ed in also - this replaces browser code with Node.js compatible code
 *
 * DO NOT EDIT THE FILE AFTER THE END OF THIS COMMENT
 */

