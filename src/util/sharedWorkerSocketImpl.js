var websocket = undefined;
var allPorts = [];

function handleSocketMessage(ev) {
    console.log('Receiving message from WS : ' + ev.data);
    var data = ev.data;

    if (data instanceof ArrayBuffer) {
        // binary message, transfer for speed
        allPorts.forEach((port) => {
            port.postMessage(data, [data]);
        });
    } else {
        // JSON message, copy string
        broadcastToAllPorts(data);
    }
}

function handleSocketControl(ev) {
    broadcastToAllPorts({ type: ev.type });
}

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
                websocket.onmessage = handleSocketMessage;
                websocket.onclose = handleSocketControl;
                websocket.onopen = handleSocketControl;
                websocket.onerror = handleSocketControl;
            } else {
                console.log('Already connected to WS @ ' + messageEvent.data.uri);
                messageEvent.currentTarget.postMessage({ type: 'open' });
            }
            break;
        case 'WRITE':
            if (websocket !== undefined) {
                websocket.send(messageEvent.data.dataToWrite);
            }
            break;
        case 'CLOSE':
            const portToRemove = messageEvent.currentTarget;
            const index = allPorts.indexOf(portToRemove);
            if (index > -1) {
                allPorts.splice(index, 1);
            }
            // Paranoïd check : 
            // If allPorts became empty the browser will shutdown
            // this worker.
            if (allPorts.length === 0) {
                websocket.close();
                websocket = undefined;
            }
            break;
    }
}
/**
 * @param {MessageEvent} messageEvent
 */
onconnect = function (messageEvent) {
    console.log('Some one is connected to worker ' + messageEvent);
    var port = messageEvent.ports[0];
    allPorts.push(port);
    port.onmessage = onMessageFromMainThread;

}

function broadcastToAllPorts(msg) {
    allPorts.forEach((port) => {
        port.postMessage(msg);
    });
}
