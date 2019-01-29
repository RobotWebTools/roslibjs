var work = require('webworkify');
var workerSocketImpl = require('./workerSocketImpl');

function WorkerSocket(uri) {
  this.socket_ = work(workerSocketImpl);

  this.socket_.addEventListener('message', this.handleWorkerMessage_.bind(this));

  this.socket_.postMessage({
    uri: uri,
  });
}

WorkerSocket.prototype.handleWorkerMessage_ = function(ev) {
  var data = ev.data;
  if (data instanceof ArrayBuffer || typeof data === 'string') {
    // binary or JSON message from rosbridge
    this.onmessage(ev);
  } else {
    // control message from the wrapped WebSocket
    var type = data.type;
    if (type === 'close') {
      this.onclose(null);
    } else if (type === 'open') {
      this.onopen(null);
    } else if (type === 'error') {
      this.onerror(null);
    } else {
      throw 'Unknown message from workersocket';
    }
  }
};

WorkerSocket.prototype.send = function(data) {
  this.socket_.postMessage(data);
};

WorkerSocket.prototype.close = function() {
  this.socket_.postMessage({
    close: true
  });
};

module.exports = WorkerSocket;
