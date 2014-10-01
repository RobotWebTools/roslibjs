/**
 * @author Brandon Alexander - baalexander@gmail.com
 */

var Canvas = require('canvas');
var Image = Canvas.Image || global.Image;
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var WebSocket = require('ws');

var Service = require('./Service');
var ServiceRequest = require('./ServiceRequest');


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
 * @constructor
 * @param options - possible keys include:
 *   * url (optional) - the WebSocket URL for rosbridge (can be specified later with `connect`)
 */
function Ros(options) {
  options = options || {};
  var url = options.url;
  this.socket = null;
  this.idCounter = 0;

  // Sets unlimited event listeners.
  this.setMaxListeners(0);

  // begin by checking if a URL was given
  if (url) {
    this.connect(url);
  }
}

Ros.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Connect to the specified WebSocket.
 *
 * @param url - WebSocket URL for Rosbridge
 */
Ros.prototype.connect = function(url) {
  var that = this;

  /**
   * Emits a 'connection' event on WebSocket connection.
   *
   * @param event - the argument to emit with the event.
   */
  function onOpen(event) {
    that.emit('connection', event);
  }

  /**
   * Emits a 'close' event on WebSocket disconnection.
   *
   * @param event - the argument to emit with the event.
   */
  function onClose(event) {
    that.emit('close', event);
  }

  /**
   * Emits an 'error' event whenever there was an error.
   *
   * @param event - the argument to emit with the event.
   */
  function onError(event) {
    that.emit('error', event);
  }

  /**
   * If a message was compressed as a PNG image (a compression hack since
   * gzipping over WebSockets * is not supported yet), this function places the
   * "image" in a canvas element then decodes the * "image" as a Base64 string.
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
      var canvas = new Canvas();
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
   * Parses message responses from rosbridge and sends to the appropriate
   * topic, service, or param.
   *
   * @param message - the raw JSON message from rosbridge.
   */
  function onMessage(message) {
    function handleMessage(message) {
      if (message.op === 'publish') {
        that.emit(message.topic, message.msg);
      } else if (message.op === 'service_response') {
        that.emit(message.id, message);
      }
    }

    var data = JSON.parse(message.data);
    if (data.op === 'png') {
      decompressPng(data, function(decompressedData) {
        handleMessage(decompressedData);
      });
    } else {
      handleMessage(data);
    }
  }

  this.socket = new WebSocket(url);
  this.socket.onopen = onOpen;
  this.socket.onclose = onClose;
  this.socket.onerror = onError;
  this.socket.onmessage = onMessage;
};

/**
 * Disconnect from the WebSocket server.
 */
Ros.prototype.close = function() {
  if (this.socket) {
    this.socket.close();
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
Ros.prototype.authenticate = function(mac, client, dest, rand, t, level, end) {
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
  this.callOnConnection(auth);
};

/**
 * Sends the message over the WebSocket, but queues the message up if not yet
 * connected.
 */
Ros.prototype.callOnConnection = function(message) {
  var that = this;
  var messageJson = JSON.stringify(message);

  if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
    that.once('connection', function() {
      that.socket.send(messageJson);
    });
  } else {
    that.socket.send(messageJson);
  }
};

/**
 * Retrieves list of topics in ROS as an array.
 *
 * @param callback function with params:
 *   * topics - Array of topic names
 */
Ros.prototype.getTopics = function(callback) {
  var topicsClient = new Service({
    ros : this,
    name : '/rosapi/topics',
    serviceType : 'rosapi/Topics'
  });

  var request = new ServiceRequest();

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
Ros.prototype.getServices = function(callback) {
  var servicesClient = new Service({
    ros : this,
    name : '/rosapi/services',
    serviceType : 'rosapi/Services'
  });

  var request = new ServiceRequest();

  servicesClient.callService(request, function(result) {
    callback(result.services);
  });
};

/**
 * Retrieves list of active node names in ROS.
 *
 * @param callback - function with the following params:
 *   * nodes - array of node names
 */
Ros.prototype.getNodes = function(callback) {
  var nodesClient = new Service({
    ros : this,
    name : '/rosapi/nodes',
    serviceType : 'rosapi/Nodes'
  });

  var request = new ServiceRequest();

  nodesClient.callService(request, function(result) {
    callback(result.nodes);
  });
};

/**
 * Retrieves list of param names from the ROS Parameter Server.
 *
 * @param callback function with params:
 *  * params - array of param names.
 */
Ros.prototype.getParams = function(callback) {
  var paramsClient = new Service({
    ros : this,
    name : '/rosapi/get_param_names',
    serviceType : 'rosapi/GetParamNames'
  });

  var request = new ServiceRequest();
  paramsClient.callService(request, function(result) {
    callback(result.names);
  });
};

/**
 * Retrieves a type of ROS topic.
 *
 * @param callback - function with params:
 *   * type - String of the topic type
 */
Ros.prototype.getTopicType = function(topic, callback) {
  var topicTypeClient = new Service({
    ros : this,
    name : '/rosapi/topic_type',
    serviceType : 'rosapi/TopicType'
  });
  var request = new ServiceRequest({
    topic: topic
  });
  topicTypeClient.callService(request, function(result) {
    callback(result.type);
  });
};

/**
 * Retrieves a detail of ROS message.
 *
 * @param callback - function with params:
 *   * details - Array of the message detail
 * @param message - String of a topic type
 */
Ros.prototype.getMessageDetails = function(message, callback) {
  var messageDetailClient = new Service({
    ros : this,
    name : '/rosapi/message_details',
    serviceType : 'rosapi/MessageDetails'
  });
  var request = new ServiceRequest({
    type: message
  });
  messageDetailClient.callService(request, function(result) {
    callback(result.typedefs);
  });
};

/**
 * Decode a typedefs into a dictionary like `rosmsg show foo/bar`
 *
 * @param defs - array of type_def dictionary
 */
Ros.prototype.decodeTypeDefs = function(defs) {
  var that = this;

  // calls itself recursively to resolve type definition using hints.
  var decodeTypeDefsRec = function(theType, hints) {
    var typeDefDict = {};
    for (var i = 0; i < theType.fieldnames.length; i++) {
      var arrayLen = theType.fieldarraylen[i];
      var fieldName = theType.fieldnames[i];
      var fieldType = theType.fieldtypes[i];
      if (fieldType.indexOf('/') === -1) { // check the fieldType includes '/' or not
        if (arrayLen === -1) {
          typeDefDict[fieldName] = fieldType;
        }
        else {
          typeDefDict[fieldName] = [fieldType];
        }
      }
      else {
        // lookup the name
        var sub = false;
        for (var j = 0; j < hints.length; j++) {
          if (hints[j].type.toString() === fieldType.toString()) {
            sub = hints[j];
            break;
          }
        }
        if (sub) {
          var subResult = decodeTypeDefsRec(sub, hints);
          if (arrayLen === -1) {
            typeDefDict[fieldName] = subResult;
          }
          else {
            typeDefDict[fieldName] = [subResult];
          }
        }
        else {
          that.emit('error', 'Cannot find ' + fieldType + ' in decodeTypeDefs');
        }
      }
    }
    return typeDefDict;
  };
  
  return decodeTypeDefsRec(defs[0], defs);
};


module.exports = Ros;