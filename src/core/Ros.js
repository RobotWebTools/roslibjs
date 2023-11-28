/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var WebSocket = require('ws');
var WorkerSocket = require('../util/workerSocket');
var socketAdapter = require('./SocketAdapter.js');

var Service = require('./Service');
var ServiceRequest = require('./ServiceRequest');

var assign = require('object-assign');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * Manages connection to the server and all interactions with ROS.
 *
 * Emits the following events:
 *  * 'error' - There was an error with ROS.
 *  * 'connection' - Connected to the WebSocket server.
 *  * 'close' - Disconnected to the WebSocket server.
 *  * &#60;topicName&#62; - A message came from rosbridge with the given topic name.
 *  * &#60;serviceID&#62; - A service response came from rosbridge with the given ID.
 *
 * @constructor
 * @param {Object} options
 * @param {string} [options.url] - The WebSocket URL for rosbridge or the node server URL to connect using socket.io (if socket.io exists in the page). Can be specified later with `connect`.
 * @param {boolean} [options.groovyCompatibility=true] - Don't use interfaces that changed after the last groovy release or rosbridge_suite and related tools.
 * @param {string} [options.transportLibrary=websocket] - One of 'websocket', 'workersocket', 'socket.io' or RTCPeerConnection instance controlling how the connection is created in `connect`.
 * @param {Object} [options.transportOptions={}] - The options to use when creating a connection. Currently only used if `transportLibrary` is RTCPeerConnection.
 */
function Ros(options) {
  options = options || {};
  var that = this;
  this.socket = null;
  this.idCounter = 0;
  this.isConnected = false;
  this.transportLibrary = options.transportLibrary || 'websocket';
  this.transportOptions = options.transportOptions || {};
  this._sendFunc = function(msg) { that.sendEncodedMessage(msg); };

  if (typeof options.groovyCompatibility === 'undefined') {
    this.groovyCompatibility = true;
  }
  else {
    this.groovyCompatibility = options.groovyCompatibility;
  }

  // Sets unlimited event listeners.
  this.setMaxListeners(0);

  // begin by checking if a URL was given
  if (options.url) {
    this.connect(options.url);
  }
}

Ros.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Connect to the specified WebSocket.
 *
 * @param {string} url - WebSocket URL or RTCDataChannel label for rosbridge.
 */
Ros.prototype.connect = function(url) {
  if (this.transportLibrary === 'socket.io') {
    this.socket = assign(io(url, {'force new connection': true}), socketAdapter(this));
    this.socket.on('connect', this.socket.onopen);
    this.socket.on('data', this.socket.onmessage);
    this.socket.on('close', this.socket.onclose);
    this.socket.on('error', this.socket.onerror);
  } else if (this.transportLibrary.constructor.name === 'RTCPeerConnection') {
    this.socket = assign(this.transportLibrary.createDataChannel(url, this.transportOptions), socketAdapter(this));
  } else if (this.transportLibrary === 'websocket') {
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      var sock = new WebSocket(url);
      sock.binaryType = 'arraybuffer';
      this.socket = assign(sock, socketAdapter(this));
    }
  } else if (this.transportLibrary === 'workersocket') {
    this.socket = assign(new WorkerSocket(url), socketAdapter(this));
  } else {
    throw 'Unknown transportLibrary: ' + this.transportLibrary.toString();
  }

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
 * Send an authorization request to the server.
 *
 * @param {string} mac - MAC (hash) string given by the trusted source.
 * @param {string} client - IP of the client.
 * @param {string} dest - IP of the destination.
 * @param {string} rand - Random string given by the trusted source.
 * @param {Object} t - Time of the authorization request.
 * @param {string} level - User level as a string given by the client.
 * @param {Object} end - End time of the client's session.
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
 * Send an encoded message over the WebSocket.
 *
 * @param {Object} messageEncoded - The encoded message to be sent.
 */
Ros.prototype.sendEncodedMessage = function(messageEncoded) {
  var emitter = null;
  var that = this;
  if (this.transportLibrary === 'socket.io') {
    emitter = function(msg){that.socket.emit('operation', msg);};
  } else {
    emitter = function(msg){that.socket.send(msg);};
  }

  if (!this.isConnected) {
    that.once('connection', function() {
      emitter(messageEncoded);
    });
  } else {
    emitter(messageEncoded);
  }
};

/**
 * Send the message over the WebSocket, but queue the message up if not yet
 * connected.
 *
 * @param {Object} message - The message to be sent.
 */
Ros.prototype.callOnConnection = function(message) {
  if (this.transportOptions.encoder) {
    this.transportOptions.encoder(message, this._sendFunc);
  } else {
    this._sendFunc(JSON.stringify(message));
  }
};

/**
 * Send a set_level request to the server.
 *
 * @param {string} level - Status level (none, error, warning, info).
 * @param {number} [id] - Operation ID to change status level on.
 */
Ros.prototype.setStatusLevel = function(level, id){
  var levelMsg = {
    op: 'set_level',
    level: level,
    id: id
  };

  this.callOnConnection(levelMsg);
};

/**
 * Retrieve a list of action servers in ROS as an array of string.
 *
 * @param {function} callback - Function with the following params:
 * @param {string[]} callback.actionservers - Array of action server names.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getActionServers = function(callback, failedCallback) {
  var getActionServers = new Service({
    ros : this,
    name : '/rosapi/action_servers',
    serviceType : 'rosapi/GetActionServers'
  });

  var request = new ServiceRequest({});
  if (typeof failedCallback === 'function'){
    getActionServers.callService(request,
      function(result) {
        callback(result.action_servers);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    getActionServers.callService(request, function(result) {
      callback(result.action_servers);
    });
  }
};

/**
 * Retrieve a list of topics in ROS as an array.
 *
 * @param {function} callback - Function with the following params:
 * @param {Object} callback.result - The result object with the following params:
 * @param {string[]} callback.result.topics - Array of topic names.
 * @param {string[]} callback.result.types - Array of message type names.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getTopics = function(callback, failedCallback) {
  var topicsClient = new Service({
    ros : this,
    name : '/rosapi/topics',
    serviceType : 'rosapi/Topics'
  });

  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    topicsClient.callService(request,
      function(result) {
        callback(result);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    topicsClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieve a list of topics in ROS as an array of a specific type.
 *
 * @param {string} topicType - The topic type to find.
 * @param {function} callback - Function with the following params:
 * @param {string[]} callback.topics - Array of topic names.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getTopicsForType = function(topicType, callback, failedCallback) {
  var topicsForTypeClient = new Service({
    ros : this,
    name : '/rosapi/topics_for_type',
    serviceType : 'rosapi/TopicsForType'
  });

  var request = new ServiceRequest({
    type: topicType
  });
  if (typeof failedCallback === 'function'){
    topicsForTypeClient.callService(request,
      function(result) {
        callback(result.topics);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    topicsForTypeClient.callService(request, function(result) {
      callback(result.topics);
    });
  }
};

/**
 * Retrieve a list of active service names in ROS.
 *
 * @param {function} callback - Function with the following params:
 * @param {string[]} callback.services - Array of service names.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getServices = function(callback, failedCallback) {
  var servicesClient = new Service({
    ros : this,
    name : '/rosapi/services',
    serviceType : 'rosapi/Services'
  });

  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    servicesClient.callService(request,
      function(result) {
        callback(result.services);
      },
      function(message) {
        failedCallback(message);
      }
    );
  }else{
    servicesClient.callService(request, function(result) {
      callback(result.services);
    });
  }
};

/**
 * Retrieve a list of services in ROS as an array as specific type.
 *
 * @param {string} serviceType - The service type to find.
 * @param {function} callback - Function with the following params:
 * @param {string[]} callback.topics - Array of service names.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getServicesForType = function(serviceType, callback, failedCallback) {
  var servicesForTypeClient = new Service({
    ros : this,
    name : '/rosapi/services_for_type',
    serviceType : 'rosapi/ServicesForType'
  });

  var request = new ServiceRequest({
    type: serviceType
  });
  if (typeof failedCallback === 'function'){
    servicesForTypeClient.callService(request,
      function(result) {
        callback(result.services);
      },
      function(message) {
        failedCallback(message);
      }
    );
  }else{
    servicesForTypeClient.callService(request, function(result) {
      callback(result.services);
    });
  }
};

/**
 * Retrieve the details of a ROS service request.
 *
 * @param {string} type - The type of the service.
 * @param {function} callback - Function with the following params:
 * @param {Object} callback.result - The result object with the following params:
 * @param {string[]} callback.result.typedefs - An array containing the details of the service request.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getServiceRequestDetails = function(type, callback, failedCallback) {
  var serviceTypeClient = new Service({
    ros : this,
    name : '/rosapi/service_request_details',
    serviceType : 'rosapi/ServiceRequestDetails'
  });
  var request = new ServiceRequest({
    type: type
  });

  if (typeof failedCallback === 'function'){
    serviceTypeClient.callService(request,
      function(result) {
        callback(result);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    serviceTypeClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieve the details of a ROS service response.
 *
 * @param {string} type - The type of the service.
 * @param {function} callback - Function with the following params:
 * @param {Object} callback.result - The result object with the following params:
 * @param {string[]} callback.result.typedefs - An array containing the details of the service response.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getServiceResponseDetails = function(type, callback, failedCallback) {
  var serviceTypeClient = new Service({
    ros : this,
    name : '/rosapi/service_response_details',
    serviceType : 'rosapi/ServiceResponseDetails'
  });
  var request = new ServiceRequest({
    type: type
  });

  if (typeof failedCallback === 'function'){
    serviceTypeClient.callService(request,
      function(result) {
        callback(result);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    serviceTypeClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieve a list of active node names in ROS.
 *
 * @param {function} callback - Function with the following params:
 * @param {string[]} callback.nodes - Array of node names.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getNodes = function(callback, failedCallback) {
  var nodesClient = new Service({
    ros : this,
    name : '/rosapi/nodes',
    serviceType : 'rosapi/Nodes'
  });

  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    nodesClient.callService(request,
      function(result) {
        callback(result.nodes);
      },
      function(message) {
        failedCallback(message);
      }
    );
  }else{
    nodesClient.callService(request, function(result) {
      callback(result.nodes);
    });
  }
};

/**
 * Retrieve a list of subscribed topics, publishing topics and services of a specific node.
 * <br>
 * These are the parameters if failedCallback is <strong>defined</strong>.
 *
 * @param {string} node - Name of the node.
 * @param {function} callback - Function with the following params:
 * @param {string[]} callback.subscriptions - Array of subscribed topic names.
 * @param {string[]} callback.publications - Array of published topic names.
 * @param {string[]} callback.services - Array of service names hosted.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 *
 * @also
 *
 * Retrieve a list of subscribed topics, publishing topics and services of a specific node.
 * <br>
 * These are the parameters if failedCallback is <strong>undefined</strong>.
 *
 * @param {string} node - Name of the node.
 * @param {function} callback - Function with the following params:
 * @param {Object} callback.result - The result object with the following params:
 * @param {string[]} callback.result.subscribing - Array of subscribed topic names.
 * @param {string[]} callback.result.publishing - Array of published topic names.
 * @param {string[]} callback.result.services - Array of service names hosted.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getNodeDetails = function(node, callback, failedCallback) {
  var nodesClient = new Service({
    ros : this,
    name : '/rosapi/node_details',
    serviceType : 'rosapi/NodeDetails'
  });

  var request = new ServiceRequest({
    node: node
  });
  if (typeof failedCallback === 'function'){
    nodesClient.callService(request,
      function(result) {
        callback(result.subscribing, result.publishing, result.services);
      },
      function(message) {
        failedCallback(message);
      }
    );
  } else {
    nodesClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieve a list of parameter names from the ROS Parameter Server.
 *
 * @param {function} callback - Function with the following params:
 * @param {string[]} callback.params - Array of param names.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getParams = function(callback, failedCallback) {
  var paramsClient = new Service({
    ros : this,
    name : '/rosapi/get_param_names',
    serviceType : 'rosapi/GetParamNames'
  });
  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    paramsClient.callService(request,
      function(result) {
        callback(result.names);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    paramsClient.callService(request, function(result) {
      callback(result.names);
    });
  }
};

/**
 * Retrieve the type of a ROS topic.
 *
 * @param {string} topic - Name of the topic.
 * @param {function} callback - Function with the following params:
 * @param {string} callback.type - The type of the topic.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getTopicType = function(topic, callback, failedCallback) {
  var topicTypeClient = new Service({
    ros : this,
    name : '/rosapi/topic_type',
    serviceType : 'rosapi/TopicType'
  });
  var request = new ServiceRequest({
    topic: topic
  });

  if (typeof failedCallback === 'function'){
    topicTypeClient.callService(request,
      function(result) {
        callback(result.type);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    topicTypeClient.callService(request, function(result) {
      callback(result.type);
    });
  }
};

/**
 * Retrieve the type of a ROS service.
 *
 * @param {string} service - Name of the service.
 * @param {function} callback - Function with the following params:
 * @param {string} callback.type - The type of the service.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getServiceType = function(service, callback, failedCallback) {
  var serviceTypeClient = new Service({
    ros : this,
    name : '/rosapi/service_type',
    serviceType : 'rosapi/ServiceType'
  });
  var request = new ServiceRequest({
    service: service
  });

  if (typeof failedCallback === 'function'){
    serviceTypeClient.callService(request,
      function(result) {
        callback(result.type);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    serviceTypeClient.callService(request, function(result) {
      callback(result.type);
    });
  }
};

/**
 * Retrieve the details of a ROS message.
 *
 * @param {string} message - The name of the message type.
 * @param {function} callback - Function with the following params:
 * @param {string} callback.details - An array of the message details.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getMessageDetails = function(message, callback, failedCallback) {
  var messageDetailClient = new Service({
    ros : this,
    name : '/rosapi/message_details',
    serviceType : 'rosapi/MessageDetails'
  });
  var request = new ServiceRequest({
    type: message
  });

  if (typeof failedCallback === 'function'){
    messageDetailClient.callService(request,
      function(result) {
        callback(result.typedefs);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    messageDetailClient.callService(request, function(result) {
      callback(result.typedefs);
    });
  }
};

/**
 * Decode a typedef array into a dictionary like `rosmsg show foo/bar`.
 *
 * @param {Object[]} defs - Array of type_def dictionary.
 */
Ros.prototype.decodeTypeDefs = function(defs) {
  var that = this;

  var decodeTypeDefsRec = function(theType, hints) {
    // calls itself recursively to resolve type definition using hints.
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
            typeDefDict[fieldName] = subResult; // add this decoding result to dictionary
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

/**
 * Retrieve a list of topics and their associated type definitions.
 *
 * @param {function} callback - Function with the following params:
 * @param {Object} callback.result - The result object with the following params:
 * @param {string[]} callback.result.topics - Array of topic names.
 * @param {string[]} callback.result.types - Array of message type names.
 * @param {string[]} callback.result.typedefs_full_text - Array of full definitions of message types, similar to `gendeps --cat`.
 * @param {function} [failedCallback] - The callback function when the service call failed with params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Ros.prototype.getTopicsAndRawTypes = function(callback, failedCallback) {
  var topicsAndRawTypesClient = new Service({
    ros : this,
    name : '/rosapi/topics_and_raw_types',
    serviceType : 'rosapi/TopicsAndRawTypes'
  });

  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    topicsAndRawTypesClient.callService(request,
      function(result) {
        callback(result);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    topicsAndRawTypesClient.callService(request, function(result) {
      callback(result);
    });
  }
};


module.exports = Ros;
