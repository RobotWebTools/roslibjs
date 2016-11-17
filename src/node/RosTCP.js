var Ros = require('../core/Ros');
var SocketIO = require('./SocketIO');
var net = require('net');
var socketAdapter = require('../core/SocketAdapter.js');
var util = require('util');

/**
 * Same as core Ros except supports TCP connections
 * also can receive a socket.io instance (options.socketio) or server intance (option.http)
 * to connect to the front using socket.io
 * @private
 */
function RosTCP(options) {
  options = options || {};
  if (!options.encoding) {
    console.error('ROSLib uses utf8 encoding by default.' +
      'It would be more efficent to use ascii (if possible)');
  }
  this.encoding = options.encoding || 'utf8';
  Ros.call(this, options);

  if (!this.socket && (options.host || options.port)) {
    this.connect({
      host: options.host,
      port: options.port
    });
  }
  if(options.http || options.socketio){
    this.io = new SocketIO(options, this);
  }
}

util.inherits(RosTCP, Ros);

/**
 * Connects to a live socket
 *
 * * url (String|Int|Object): Address and port to connect to (see http://nodejs.org/api/net.html)
 *     format {host: String, port: Int} or (port:Int), or "host:port"
 */
RosTCP.prototype.connect = function(url) {
  if (typeof url === 'string' && (url.slice(0, 5) === 'ws://' || url.slice(0, 6) === 'wss://')) {
    Ros.prototype.connect.call(this, url);
  } else {
    var events = socketAdapter(this);
    this.socket = net.connect(url)
      .on('data', events.onmessage)
      .on('close', events.onclose)
      .on('error', events.onerror)
      .on('connect', events.onopen);
    this.socket.setEncoding(this.encoding);
    this.socket.setTimeout(0);

    // Little hack for call on connection
    this.socket.send = this.socket.write;
    // Similarly for close
    this.socket.close = this.socket.end;
  }
};

module.exports = RosTCP;
