// Goto chrome://inspect/#workers to inspect webworkers (and see console.logs !)
const webworkify = require("webworkify");

/*const sharedWorkerSocketImpl = require("./sharedWorkerSocketImpl");*/
/**
 * @param {string} url to connect to, e.g. "ws://localhost:9090".
 */
function SharedWorkerConnection(url) {
    var blob = webworkify(require("./sharedWorkerSocketImpl"), { bare: true });
    var workerUrl = URL.createObjectURL(blob);
    fetch(workerUrl).then(function (response) {
        response.text().then(function (workerSource) {
            const workerURL = 'data:application/javascript;base64,' + btoa(workerSource);
            this.worker_ = new SharedWorker(workerURL);

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