console.log('Attaching Shared Worker : ');
//const broadcastChannel = new BroadcastChannel('roslib.SharedWebSocketChannel');
var websocket = undefined;
var clientCount = 0;
var allPorts = [];
/**
 * @param {MessageEvent} messageEvent
 */
function onMessageFromMainThread(messageEvent) {
    console.log('Receiving message from main thread : ' + messageEvent.data.type);
    switch (messageEvent.data.type) {
        case 'CONNECT':
            if (websocket === undefined) {
                console.log('Trying to connect to WS @ ' + messageEvent.data.uri);
                websocket = new WebSocket(messageEvent.data.uri);
            } else {
                console.log('Already connected to WS @ ' + messageEvent.data.uri);
            }
            break;
        case 'WRITE':
            if (websocket !== undefined) {
                websocket.send(messageEvent.data.dataToWrite);
            }
            break;
    }
}
/**
 * @param {MessageEvent} messageEvent
 */
onconnect = function(messageEvent) {
    console.log('Some one is connected to worker ' + messageEvent);
    var port = messageEvent.ports[0];
    clientCount = clientCount + 1;
    allPorts.push(port);
    port.onmessage = onMessageFromMainThread;
}

setInterval(() => {
    //broadcastChannel.postMessage('toto ' + clientCount);
    allPorts.forEach((port) => {
        port.postMessage('toto ' + clientCount);
    });
}, 1000);