// Goto chrome://inspect/#workers to inspect webworkers (and see console.logs !)

/**
 * @param {string} url to connect to, e.g. "ws://localhost:9090".
 */
function SharedWorkerConnection(url, sharedWorkerURL) {
   console.log('Creating shared worker');
   this.worker_ = new SharedWorker(sharedWorkerURL);
   this.worker_.port.start();
   this.worker_.port.postMessage({ type: 'CONNECT', uri: url });
   this.worker_.port.onmessage = (ev) => {
       console.log(ev.data);
   };
}

SharedWorkerConnection.prototype.close = function() {
    this.worker_.port.postMessage({ type: 'CLOSE' });
    console.log('Closing One shared Worker');
}

module.exports = SharedWorkerConnection;