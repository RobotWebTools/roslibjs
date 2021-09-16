// import WebSocket from 'ws' // TODO
var WebSocket = WebSocket || require('ws'); // eslint-disable-line

// TODO this was exported and webworkify handled the special export format.
// Now, we need to fetch the source string instead and put it in a worker the
// normal way.
export function workerSocketImpl(self) {
  var socket = null;

  function handleSocketMessage(ev) {
    var data = ev.data;

    if (data instanceof ArrayBuffer) {
      // binary message, transfer for speed
      self.postMessage(data, [data]);
    } else {
      // JSON message, copy string
      self.postMessage(data);
    }
  }

  function handleSocketControl(ev) {
    self.postMessage({type: ev.type});
  }

  self.addEventListener('message', function(ev) {
    var data = ev.data;

    if (typeof data === 'string') {
      // JSON message from ROSLIB
      socket.send(data);
    } else {
      // control message
      if (data.hasOwnProperty('close')) {
        socket.close();
        socket = null;
      } else if (data.hasOwnProperty('uri')) {
        var uri = data.uri;

        socket = new WebSocket(uri);
        socket.binaryType = 'arraybuffer';

        socket.onmessage = handleSocketMessage;
        socket.onclose = handleSocketControl;
        socket.onopen = handleSocketControl;
        socket.onerror = handleSocketControl;
      } else {
        throw 'Unknown message to WorkerSocket';
      }
    }
  });
};
