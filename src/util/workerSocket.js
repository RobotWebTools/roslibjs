import work from 'webworkify';

// TODO `import` syntax is not designed for this purpose. Instead, we should
// fetch the source code, and stick the string into a worker.
import {workerSocketImpl} from './workerSocketImpl';

export function WorkerSocket(uri) {
  this.socket_ = work(workerSocketImpl/*TODO*/);

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
