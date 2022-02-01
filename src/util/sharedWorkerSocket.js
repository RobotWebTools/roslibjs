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
        this.handleWorkerMessage_(ev);
    };
}

SharedWorkerConnection.prototype.send = function (data) {
    this.worker_.port.postMessage({ type: 'WRITE', dataToWrite: data });
}

SharedWorkerConnection.prototype.handleWorkerMessage_ = function (ev) {
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
SharedWorkerConnection.prototype.close = function () {
    this.worker_.port.postMessage({ type: 'CLOSE' });
}

module.exports = SharedWorkerConnection;