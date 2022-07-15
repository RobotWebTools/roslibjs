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
    if (ev.type === 'close' && websocket !== undefined) {
        websocket.close();
        websocket = undefined;
        for (var p = 0; p < allPorts.length; p++) {
            allPorts[p].close();
        }
        allPorts = [];
    }
}

/**
 * @param {MessageEvent} messageEvent
 */
function onMessageFromMainThread(messageEvent) {
    switch (messageEvent.data.type) {
        case 'CONNECT':
            // Compare urls figures without special characters
            var extractNumbersFromUrl = 0;
            var extractNumbersFromUri = 0;
            if (websocket !== undefined) {
                extractNumbersFromUrl = websocket.url.match(/\d/g);
                extractNumbersFromUrl = extractNumbersFromUrl.join('');
                extractNumbersFromUri = messageEvent.data.uri.match(/\d/g);
                extractNumbersFromUri = extractNumbersFromUri.join('');
            }
            if (websocket === undefined || extractNumbersFromUrl !== extractNumbersFromUri) {
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
            for (var p = 0; p < allPorts.length; p++) {
                allPorts[p].close();
            }
            websocket.close();
            websocket = undefined;
            allPorts = [];
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
