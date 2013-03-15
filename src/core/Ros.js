/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * Manages connection to the server and all interactions with ROS.
 *
 * Emits the following events:
 *  * 'error' - there was an error with ROS
 *  * 'connection' - connected to the WebSocket server
 *  * 'close' - disconnected to the WebSocket server
 *  * <topicName> - a message came from rosbridge with the given topic name
 *  * <serviceID> - a service response came from rosbridge with the given ID
 *
 *  @constructor
 *  @param url (optional) - The WebSocket URL for rosbridge. Can be specified later with `connect`.
 */
ROSLIB.Ros = function(url) {
  var ros = this;
  this.socket = null;

  /**
   * Emits a 'connection' event on WebSocket connection.
   * 
   * @param event - the argument to emit with the event.
   */
  function onOpen(event) {
    ros.emit('connection', event);
  };

  /**
   * Emits a 'close' event on WebSocket disconnection.
   * 
   * @param event - the argument to emit with the event.
   */
  function onClose(event) {
    ros.emit('close', event);
  };

  /**
   * Emits an 'error' event whenever there was an error.
   * 
   * @param event - the argument to emit with the event.
   */
  function onError(event) {
    ros.emit('error', event);
  };

  /**
   * If a message was compressed as a PNG image (a compression hack since gzipping over WebSockets
   * is not supported yet), this function places the "image" in a canvas element then decodes the
   * "image" as a Base64 string.
   *
   * @param data - object containing the PNG data.
   * @param callback - function with params:
   *   * data - the uncompressed data
   */
  function decompressPng(data, callback) {
    // Uncompresses the data before sending it through (use image/canvas to do so).
    var image = new Image();
    // When the image loads, extracts the raw data (JSON message).
    image.onload = function() {
      // Creates a local canvas to draw on.
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');

      // Sets width and height.
      canvas.width = image.width;
      canvas.height = image.height;

      // Puts the data into the image.
      context.drawImage(image, 0, 0);
      // Grabs the raw, uncompressed data.
      var imageData = context.getImageData(0, 0, image.width, image.height).data;

      // Constructs the JSON.
      var jsonData = '';
      for ( var i = 0; i < imageData.length; i += 4) {
        // RGB
        jsonData += String.fromCharCode(imageData[i], imageData[i + 1], imageData[i + 2]);
      }
      var decompressedData = JSON.parse(jsonData);
      callback(decompressedData);
    };
    // Sends the image data to load.
    image.src = 'data:image/png;base64,' + data.data;
  }

  /**
   * Parses message responses from rosbridge and sends to the appropriate topic, service, or param.
   *
   * @param message - the raw JSON message from rosbridge.
   */
  function onMessage(message) {
    function handleMessage(message) {
      if (message.op === 'publish') {
        ros.emit(message.topic, message.msg);
      } else if (message.op === 'service_response') {
        ros.emit(message.id, message.values);
      }
    };

    var data = JSON.parse(message.data);
    if (data.op === 'png') {
      decompressPng(data, function(decompressedData) {
        handleMessage(decompressedData);
      });
    } else {
      handleMessage(data);
    }
  };

  /**
   * Connect to the specified WebSocket.
   *
   * @param url - WebSocket URL for Rosbridge
   */
  this.connect = function(url) {
    ros.socket = new WebSocket(url);
    ros.socket.onopen = onOpen;
    ros.socket.onclose = onClose;
    ros.socket.onerror = onError;
    ros.socket.onmessage = onMessage;
  };

  /**
   * Disconnect from the WebSocket server.
   */
  this.close = function() {
    if (ros.socket) {
      ros.socket.close();
    }
  };

  /**
   * Sends an authorization request to the server.
   *
   * @param mac - MAC (hash) string given by the trusted source.
   * @param client - IP of the client.
   * @param dest - IP of the destination.
   * @param rand - Random string given by the trusted source.
   * @param t - Time of the authorization request.
   * @param level - User level as a string given by the client.
   * @param end - End time of the client's session.
   */
  this.authenticate = function(mac, client, dest, rand, t, level, end) {
    // create the request
    var auth = {
      op : 'auth',
      mac : mac,
      client : client,
      dest : dest,
      rand : rand,
      t : t,
      level : level,
      end : end
    };
    // send the request
    callOnConnection(auth);
  };

  /**
   * Sends the message over the WebSocket, but queues the message up if not yet connected.
   */
  this.callOnConnection = function(message) {
    var messageJson = JSON.stringify(message);

    if (ros.socket.readyState !== WebSocket.OPEN) {
      ros.once('connection', function() {
        ros.socket.send(messageJson);
      });
    } else {
      ros.socket.send(messageJson);
    }
  };

  /**
   * Retrieves list of topics in ROS as an array.
   *
   * @param callback function with params:
   *   * topics - Array of topic names
   */
  this.getTopics = function(callback) {
    var topicsClient = new ROSLIB.Service({
      ros : ros,
      name : '/rosapi/topics',
      serviceType : 'rosapi/Topics'
    });

    var request = new ROSLIB.ServiceRequest();

    topicsClient.callService(request, function(result) {
      callback(result.topics);
    });
  };

  /**
   * Retrieves list of active service names in ROS.
   *
   * @param callback - function with the following params:
   *   * services - array of service names
   */
  this.getServices = function(callback) {
    var servicesClient = new ROSLIB.Service({
      ros : ros,
      name : '/rosapi/services',
      serviceType : 'rosapi/Services'
    });

    var request = new ROSLIB.ServiceRequest();

    servicesClient.callService(request, function(result) {
      callback(result.services);
    });
  };

  /**
   * Retrieves list of param names from the ROS Parameter Server.
   *
   * @param callback function with params:
   *  * params - array of param names.
   */
  this.getParams = function(callback) {
    var paramsClient = new ROSLIB.Service({
      ros : ros,
      name : '/rosapi/get_param_names',
      serviceType : 'rosapi/GetParamNames'
    });

    var request = new ROSLIB.ServiceRequest();
    paramsClient.callService(request, function(result) {
      callback(result.names);
    });
  };

  // begin by checking if a URL was given
  if (url) {
    this.connect(url);
  }
};
ROSLIB.Ros.prototype.__proto__ = EventEmitter2.prototype;
