var Ros = require('../core/Ros');
var net = require('net');
var socketAdapter = require('../core/SocketAdapter.js');
var util = require('util');

/**
 * Same as core Ros except supports TCP connections
 * @private
 */ 
function RosTCP(options) {
  options = options || {};
  if (!options.encoding) {
    util.debug('ROSLib uses utf8 encoding by default.' +
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
}

util.inherits(RosTCP, Ros);

/**
 * Connects to a live socket
 *
 * * url (String|Int|Object): Address and port to connect to (see http://nodejs.org/api/net.html)
 *     format {host: String, port: Int} or (port:Int), or "host:port"
 */
RosTCP.prototype.connect = function(url) {
  if (typeof url === 'string' && url.slice(0, 5) === 'ws://') {
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