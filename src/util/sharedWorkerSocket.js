// Goto chrome://inspect/#workers to inspect webworkers (and see console.logs !)
var fs = require('fs');
/**
 * @param {string} url to connect to, e.g. "ws://localhost:9090".
 */
function SharedWorkerConnection(url) {
    if (typeof window === 'undefined') {
        throw new Error('SharedWorkerConnection can only be used in a browser');
    }
    if(typeof window.SharedWorker === 'undefined') {
        throw new Error('SharedWorker is not supported in this browser');
    }
    //*jslint browser: true */
    /*global window */

    // Here we use brfs to inline the worker code in the script variable bellow.
    // The following line is evaluated at build time (when browserify "compile" the file).
    // See the doc : https://www.npmjs.com/package/brfs
    var script = fs.readFileSync(__dirname + '/sharedWorkerSocketImpl.js', 'utf8');
    var b64script = window.btoa(window.unescape(window.encodeURIComponent(script)));
    /* To construct a shared worker we need an URL. This URL must be striclty the same in all
       browser windows. Here URL is the base64 encoded version of the worker code, so for
       a same worker code, the URL will be the same in all windows !
     */
    this.worker_ = new window.SharedWorker('data:application/javascript;base64,' + b64script);

    this.worker_.port.start();
    this.worker_.port.postMessage({ type: 'CONNECT', uri: url });
    this.worker_.port.onmessage = function (ev) {
        this.handleWorkerMessage_(ev);
    };
}

SharedWorkerConnection.prototype.send = function (data) {
    this.worker_.port.postMessage({ type: 'WRITE', dataToWrite: data });
};

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
};

module.exports = SharedWorkerConnection;