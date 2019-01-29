var WebSocket = WebSocket || require('ws');

module.exports = function(self) {
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
      // args from WorkerSocket constructor
      var uri = data.uri;

      socket = new WebSocket(uri);
      socket.binaryType = 'arraybuffer';

      socket.onmessage = handleSocketMessage;
      socket.onclose = handleSocketControl;
      socket.onopen = handleSocketControl;
      socket.onerror = handleSocketControl;
    }
  });
};
