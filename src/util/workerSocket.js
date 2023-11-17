try {
  // @ts-expect-error -- webworker include workarounds I don't know enough about to fix right now
  var work = require("webworkify");
} catch(ReferenceError) {
  // @ts-expect-error -- webworker include workarounds I don't know enough about to fix right now
  // webworkify raises ReferenceError when required inside webpack
  var work = require("webworkify-webpack");
}
var workerSocketImpl = require('./workerSocketImpl');

class WorkerSocket {
  constructor(uri) {
    this.socket_ = work(workerSocketImpl);

    this.socket_.addEventListener(
      "message",
      this.handleWorkerMessage_.bind(this)
    );

    this.socket_.postMessage({
      uri: uri,
    });
  }
  handleWorkerMessage_(ev) {
    var data = ev.data;
    if (data instanceof ArrayBuffer || typeof data === "string") {
      // binary or JSON message from rosbridge
      this.onmessage(ev);
    } else {
      // control message from the wrapped WebSocket
      var type = data.type;
      if (type === "close") {
        this.onclose(null);
      } else if (type === "open") {
        this.onopen(null);
      } else if (type === "error") {
        this.onerror(null);
      } else {
        throw "Unknown message from workersocket";
      }
    }
  }
  send(data) {
    this.socket_.postMessage(data);
  }
  close() {
    this.socket_.postMessage({
      close: true,
    });
  }
}




module.exports = WorkerSocket;
