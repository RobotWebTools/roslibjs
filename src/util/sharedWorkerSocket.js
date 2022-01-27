// Goto chrome://inspect/#workers to inspect webworkers (and see console.logs !)
const webworkify = require("webworkify");

/*const sharedWorkerSocketImpl = require("./sharedWorkerSocketImpl");*/
/**
 * @param {string} url to connect to, e.g. "ws://localhost:9090".
 */
function SharedWorkerConnection(url) {
    var blob = webworkify(require("./sharedWorkerSocketImpl"), { bare: true });
    var workerUrl = URL.createObjectURL(blob);
    // Here we would like to write : this.worker_ = new SharedWorker(workerUrl);
    // But webworkify generate different URL at each call, so the worker is not shared
    // beacause all URL are different.
    // So we try the following trick :
    fetch(workerUrl).then(function (response) {
        response.text().then(function (workerSource) {
            // here workerSource is javascript source code of the worker
            const workerURL = 'data:application/javascript;base64,' + btoa(workerSource);
            // we juste create an url with the source code encoded in base64
            this.worker_ = new SharedWorker(workerURL);
            // And we create a worker with this url. We can't use BroadcastChannel in this worker
            // because of the "opaque origin" of such URL.
            // But this still not work because webworkify add an UUID in the source code, and so the
            // URL is always different...
            this.worker_.port.start();
            this.worker_.port.postMessage({ type: 'CONNECT', uri: url });
            const broadcastChannel = new BroadcastChannel('roslib.SharedWebSocketChannel');
            broadcastChannel.onmessage = (ev) => {
                console.log('message from WS : ' + ev.data);
            };
        });
    });
}

module.exports = SharedWorkerConnection;