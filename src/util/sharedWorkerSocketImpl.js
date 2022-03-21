/*global onconnect: true*/
/*global WebSocket*/
var websocket;
var allPorts = [];

function handleSocketMessage(ev) {
    var data = ev.data;

    if (data instanceof ArrayBuffer) {
        // binary message, transfer for speed
        for (var p = 0; p < allPorts.length; p++) {
            allPorts[p].postMessage(data, [data]);
        }
    } else {
        // JSON message, copy string
        broadcastToAllPorts(data);
    }
}

function handleSocketControl(ev) {
    broadcastToAllPorts({ type: ev.type });
    if (ev.type === 'close') {
        websocket = undefined;
    }
}

/**
 * @param {MessageEvent} messageEvent
 */
function onMessageFromMainThread(messageEvent) {
    switch (messageEvent.data.type) {
        case 'CONNECT':
            if (websocket === undefined) {
                websocket = new WebSocket(messageEvent.data.uri);
                websocket.binaryType = 'arraybuffer';
                websocket.onmessage = handleSocketMessage;
                websocket.onclose = handleSocketControl;
                websocket.onopen = handleSocketControl;
                websocket.onerror = handleSocketControl;
            } else {
                if (websocket.readyState === WebSocket.OPEN) {
                    messageEvent.currentTarget.postMessage({ type: 'open' });
                }
            }
            break;
        case 'WRITE':
            if (websocket !== undefined && websocket.readyState === WebSocket.OPEN) {
                websocket.send(messageEvent.data.dataToWrite);
            }
            break;
        case 'CLOSE':
            var portToRemove = messageEvent.currentTarget;
            var index = allPorts.indexOf(portToRemove);
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
    var port = messageEvent.ports[0];
    allPorts.push(port);
    port.onmessage = onMessageFromMainThread;
};

function broadcastToAllPorts(msg) {
    for (var p = 0; p < allPorts.length; p++) {
        allPorts[p].postMessage(msg);
    }
}
