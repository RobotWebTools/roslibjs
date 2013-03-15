/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROSLIB = ROSLIB || {
  REVISION : '1'
};
/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * An actionlib action client.
 *
 * Emits the following events:
 *  * 'timeout' - if a timeout occurred while sending a goal
 *  * 'status' - the status messages received from the action server
 *  * 'feedback' -  the feedback messages received from the action server
 *  * 'result' - the result returned from the action server
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * serverName - the action server name, like /fibonacci
 *   * actionName - the action message name, like 'actionlib_tutorials/FibonacciAction'
 *   * timeout - the timeout length when connecting to the action server
 */
ROSLIB.ActionClient = function(options) {
  var that = this;
  options = options || {};
  this.ros = options.ros;
  this.serverName = options.serverName;
  this.actionName = options.actionName;
  this.timeout = options.timeout;
  this.goals = {};

  // flag to check if a status has been received
  var receivedStatus = false;

  // create the topics associated with actionlib
  var feedbackListener = new ROSLIB.Topic({
    ros : this.ros,
    name : this.serverName + '/feedback',
    messageType : this.actionName + 'Feedback'
  });
  var statusListener = new ROSLIB.Topic({
    ros : this.ros,
    name : this.serverName + '/status',
    messageType : 'actionlib_msgs/GoalStatusArray'
  });
  var resultListener = new ROSLIB.Topic({
    ros : this.ros,
    name : this.serverName + '/result',
    messageType : this.actionName + 'Result'
  });
  this.goalTopic = new ROSLIB.Topic({
    ros : this.ros,
    name : this.serverName + '/goal',
    messageType : this.actionName + 'Goal'
  });
  this.cancelTopic = new ROSLIB.Topic({
    ros : this.ros,
    name : this.serverName + '/cancel',
    messageType : 'actionlib_msgs/GoalID'
  });

  /**
   * Cancel all goals associated with this ActionClient.
   */
  this.cancel = function() {
    var cancelMessage = new ROSLIB.Message({});
    this.cancelTopic.publish(cancelMessage);
  };

  // advertise the goal and cancel topics
  this.goalTopic.advertise();
  this.cancelTopic.advertise();

  // subscribe to the status topic
  statusListener.subscribe(function(statusMessage) {
    receivedStatus = true;
    statusMessage.status_list.forEach(function(status) {
      var goal = that.goals[status.goal_id.id];
      if (goal) {
        goal.emit('status', status);
      }
    });
  });

  // subscribe the the feedback topic
  feedbackListener.subscribe(function(feedbackMessage) {
    var goal = that.goals[feedbackMessage.status.goal_id.id];
    if (goal) {
      goal.emit('status', feedbackMessage.status);
      goal.emit('feedback', feedbackMessage.feedback);
    }
  });

  // subscribe to the result topic
  resultListener.subscribe(function(resultMessage) {
    var goal = that.goals[resultMessage.status.goal_id.id];

    if (goal) {
      goal.emit('status', resultMessage.status);
      goal.emit('result', resultMessage.result);
    }
  });

  // If timeout specified, emit a 'timeout' event if the action server does not respond
  if (this.timeout) {
    setTimeout(function() {
      if (!receivedStatus) {
        that.emit('timeout');
      }
    }, this.timeout);
  }
};
ROSLIB.ActionClient.prototype.__proto__ = EventEmitter2.prototype;
/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * An actionlib goal that is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - if a timeout occurred while sending a goal 
 *
 *  @constructor
 *  @param object with following keys:
 *   * actionClient - the ROSLIB.ActionClient to use with this goal
 *   * goalMessage - The JSON object containing the goal for the action server
 */

ROSLIB.Goal = function(options) {
  var that = this;
  this.actionClient = options.actionClient;
  this.goalMessage = options.goalMessage;
  this.isFinished = false;

  // used to create random IDs
  var date = new Date();

  /**
   * Send the goal to the action server.
   * 
   * @param timeout (optional) - a timeout length for the goal's result
   */
  this.send = function(timeout) {
    that.actionClient.goalTopic.publish(that.goalMessage);
    if (timeout) {
      setTimeout(function() {
        if (!that.isFinished) {
          that.emit('timeout');
        }
      }, timeout);
    }
  };

  /**
   * Cancel the current this.
   */
  this.cancel = function() {
    var cancelMessage = new ROSLIB.Message({
      id : that.goalID
    });
    that.actionClient.cancelTopic.publish(cancelMessage);
  };

  // create a random ID
  this.goalID = 'goal_' + Math.random() + "_" + date.getTime();
  // fill in the goal message
  this.goalMessage = new ROSLIB.Message({
    goal_id : {
      stamp : {
        secs : 0,
        nsecs : 0
      },
      id : this.goalID
    },
    goal : this.goalMessage
  });

  this.on('status', function(status) {
    this.status = status;
  });

  this.on('result', function(result) {
    this.isFinished = true;
    this.result = result;
  });

  this.on('feedback', function(feedback) {
    this.feedback = feedback;
  });

  // add the goal
  this.actionClient.goals[this.goalID] = this;

};
ROSLIB.Goal.prototype.__proto__ = EventEmitter2.prototype;
/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * Message objects are used for publishing and subscribing to and from topics.
 * 
 * @constructor
 * @param values - object matching the fields defined in the .msg definition file.
 */
ROSLIB.Message = function(values) {
  var that = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ROS parameter.
 *
 * @constructor
 * @param options - possible keys include:
 *   * name - the param name, like max_vel_x
 */
ROSLIB.Param = function(options) {
  var that = this;
  options = options || {};
  this.name = options.name;

  /**
   * Fetches the value of the param.
   *
   * @param callback - function with the following params:
   *  * value - the value of the param from ROS.
   */
  this.get = function(callback) {
    var paramClient = new ROSLIB.Service({
      name : '/rosapi/get_param',
      serviceType : 'rosapi/GetParam'
    });

    var request = new ROSLIB.ServiceRequest({
      name : that.name,
      value : JSON.stringify('')
    });

    paramClient.callService(request, function(result) {
      var value = JSON.parse(result.value);
      callback(value);
    });
  };

  /**
   * Sets the value of the param in ROS.
   *
   * @param value - value to set param to.
   */
  this.set = function(value) {
    var paramClient = new ROSLIB.Service({
      name : '/rosapi/set_param',
      serviceType : 'rosapi/SetParam'
    });

    var request = new ROSLIB.ServiceRequest({
      name : that.name,
      value : JSON.stringify(value)
    });

    paramClient.callService(request, function() {
    });
  };
};
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
  var that = this;
  this.socket = null;

  /**
   * Emits a 'connection' event on WebSocket connection.
   * 
   * @param event - the argument to emit with the event.
   */
  function onOpen(event) {
    that.emit('connection', event);
  };

  /**
   * Emits a 'close' event on WebSocket disconnection.
   * 
   * @param event - the argument to emit with the event.
   */
  function onClose(event) {
    that.emit('close', event);
  };

  /**
   * Emits an 'error' event whenever there was an error.
   * 
   * @param event - the argument to emit with the event.
   */
  function onError(event) {
    that.emit('error', event);
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
        that.emit(message.topic, message.msg);
      } else if (message.op === 'service_response') {
        that.emit(message.id, message.values);
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
    that.socket = new WebSocket(url);
    that.socket.onopen = onOpen;
    that.socket.onclose = onClose;
    that.socket.onerror = onError;
    that.socket.onmessage = onMessage;
  };

  /**
   * Disconnect from the WebSocket server.
   */
  this.close = function() {
    if (that.socket) {
      that.socket.close();
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

    if (that.socket.readyState !== WebSocket.OPEN) {
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
  this.getTopics = function(callback) {
    var topicsClient = new ROSLIB.Service({
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
/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ROS service client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like /add_two_ints
 *   * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
 */
ROSLIB.Service = function(options) {
  var that = this;
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.serviceType = options.serviceType;

  /**
   * Calls the service. Returns the service response in the callback.
   * 
   * @param request - the ROSLIB.ServiceRequest to send
   * @param callback - function with params:
   *   * response - the response from the service request
   */
  this.callService = function(request, callback) {
    that.ros.idCounter++;
    serviceCallId = 'call_service:' + that.name + ':' + that.ros.idCounter;

    that.ros.once(serviceCallId, function(data) {
      var response = new ROSLIB.ServiceResponse(data);
      callback(response);
    });

    var requestValues = [];
    Object.keys(request).forEach(function(name) {
      requestValues.push(request[name]);
    });

    var call = {
      op : 'call_service',
      id : serviceCallId,
      service : that.name,
      args : requestValues
    };
    that.ros.callOnConnection(call);
  };
};
/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @param values - object matching the values of the request part from the .srv file.
 */
ROSLIB.ServiceRequest = function(values) {
  var that = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @param values - object matching the values of the response part from the .srv file.
 */
ROSLIB.ServiceResponse = function(values) {
  var that = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * Publish and/or subscribe to a topic in ROS.
 * 
 * Emits the following events:
 *  * 'warning' - if there are any warning during the Topic creation
 *  * 'message' - the message data from rosbridge
 *  
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the topic name, like /cmd_vel
 *   * messageType - the message type, like 'std_msgs/String'
 *   * compression - the type of compression to use, like 'png'
 *   * throttle_rate - the rate at which to throttle the topics
 */
ROSLIB.Topic = function(options) {
  var that = this;
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.messageType = options.messageType;
  this.isAdvertised = false;
  this.compression = options.compression || 'none';
  this.throttle_rate = options.throttle_rate || 0;

  // Check for valid compression types
  if (this.compression && this.compression !== 'png' && this.compression !== 'none') {
    this.emit('warning', this.compression
        + ' compression is not supported. No comression will be used.');
  }

  // Check if throttle rate is negative
  if (this.throttle_rate < 0) {
    this.emit('warning', this.throttle_rate + ' is not allowed. Set to 0');
    this.throttle_rate = 0;
  }

  /**
   * Every time a message is published for the given topic, the callback
   * will be called with the message object.
   *
   * @param callback - function with the following params:
   *   * message - the published message
   */
  this.subscribe = function(callback) {
    that.on('message', function(message) {
      callback(message);
    });

    that.ros.on(that.name, function(data) {
      var message = new ROSLIB.Message(data);
      that.emit('message', message);
    });

    that.ros.idCounter++;
    var subscribeId = 'subscribe:' + that.name + ':' + that.ros.idCounter;
    var call = {
      op : 'subscribe',
      id : subscribeId,
      type : that.messageType,
      topic : that.name,
      compression : that.compression,
      throttle_rate : that.throttle_rate
    };

    that.ros.callOnConnection(call);
  };

  /**
   * Unregisters as a subscriber for the topic. Unsubscribing will remove
   * all subscribe callbacks.
   */
  this.unsubscribe = function() {
    that.ros.removeAllListeners([ that.name ]);
    that.ros.idCounter++;
    var unsubscribeId = 'unsubscribe:' + that.name + ':' + that.ros.idCounter;
    var call = {
      op : 'unsubscribe',
      id : unsubscribeId,
      topic : that.name
    };
    that.ros.callOnConnection(call);
  };

  /**
   * Registers as a publisher for the topic.
   */
  this.advertise = function() {
    that.ros.idCounter++;
    var advertiseId = 'advertise:' + that.name + ':' + that.ros.idCounter;
    var call = {
      op : 'advertise',
      id : advertiseId,
      type : that.messageType,
      topic : that.name
    };
    that.ros.callOnConnection(call);
    that.isAdvertised = true;
  };

  /**
   * Unregisters as a publisher for the topic.
   */
  this.unadvertise = function() {
    that.ros.idCounter++;
    var unadvertiseId = 'unadvertise:' + that.name + ':' + that.ros.idCounter;
    var call = {
      op : 'unadvertise',
      id : unadvertiseId,
      topic : that.name
    };
    that.ros.callOnConnection(call);
    that.isAdvertised = false;
  };

  /**
   * Publish the message.
   *
   * @param message - A ROSLIB.Message object.
   */
  this.publish = function(message) {
    if (!that.isAdvertised) {
      that.advertise();
    }

    that.ros.idCounter++;
    var publishId = 'publish:' + that.name + ':' + that.ros.idCounter;
    var call = {
      op : 'publish',
      id : publishId,
      topic : that.name,
      msg : message
    };
    that.ros.callOnConnection(call);
  };
};
ROSLIB.Topic.prototype.__proto__ = EventEmitter2.prototype;
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['robotwebtools/eventemitter2','robotwebtools/actionclient'], factory);
  }
  else {
    root.TfClient = factory(root.EventEmitter2,root.ActionClient);
  }
}(this, function (EventEmitter2, ActionClient) {

  var TfClient = function(options) {
    this.ros = options.ros;
    this.fixedFrame = options.fixedFrame || 'base_link';
    this.angularThres = options.angularThres || 2.0;
    this.transThres = options.transThres || 0.01;
    this.rate = options.rate || 10.0;
    this.goalUpdateDelay = options.goalUpdateDelay !== undefined ? options.goalUpdateDelay : 50;

    var options = {
      ros: this.ros,
      serverName: options.serverName || "/tf2_web_republisher",
      actionName: "tf2_web_republisher/TFSubscriptionAction"
    };

    this.actionClient = new ActionClient( options );
    this.currentGoal = false;
    this.frame_infos = {};
    this.goalUpdateRequested = false;
  };

  TfClient.prototype.__proto__ = EventEmitter2.prototype;

  TfClient.prototype.processFeedback = function(tfMsg) {
    var that = this;
    tfMsg.transforms.forEach( function(transform) {
      var frameId = transform.child_frame_id;
      var info = that.frame_infos[frameId];
      if ( info != undefined ) {
        info.transform = new Transform(transform.transform.translation,transform.transform.rotation);
        info.cbs.forEach(function(cb) {
          cb(info.transform);
        });
      }
    });
  }

  TfClient.prototype.requestGoalUpdate = function() {
    if ( !this.goalUpdateRequested ) {
      setTimeout(this.updateGoal.bind(this), this.goalUpdateDelay);
      this.goalUpdateRequested = true;
      return;
    }
  }

  TfClient.prototype.updateGoal = function() {
    // Anytime the list of frames changes,
    // we will need to send a new goal.
    if ( this.currentGoal ) {
      this.currentGoal.cancel();
    }

    var goalMsg = {
      source_frames: [],
       target_frame: this.fixedFrame,
       angular_thres: this.angularThres,
       trans_thres: this.transThres,
       rate: this.rate
    };

    var source_frames = [];
    for (frame in this.frame_infos ) {
      goalMsg.source_frames.push(frame);
    };

    this.currentGoal = new this.actionClient.Goal(goalMsg);
    this.currentGoal.on('feedback', this.processFeedback.bind(this));
    this.currentGoal.send();
    this.goalUpdateRequested = false;
  }

  TfClient.prototype.subscribe = function(frameId,callback) {
    // make sure the frame id is relative
    if ( frameId[0] === "/" ) {
      frameId = frameId.substring(1);
    }
    // if there is no callback registered for the given frame,
    // create emtpy callback list
    if ( this.frame_infos[frameId] == undefined ) {
      this.frame_infos[frameId] = {
        cbs: [] };
      this.requestGoalUpdate();
    } else {
      // if we already have a transform, call back immediately
      if ( this.frame_infos[frameId].transform != undefined ) {
        callback( this.frame_infos[frameId].transform );
      }
    }
    this.frame_infos[frameId].cbs.push( callback );
  };

  TfClient.prototype.unsubscribe = function(frameId,callback) {
    var info = this.frame_infos[frameId];
    if ( info != undefined ) {
      var cbIndex = info.cbs.indexOf( callback );
      if ( cbIndex >= 0 ) {
        info.cbs.splice(cbIndex, 1);
        if ( info.cbs.length == 0 ) {
          delete this.frame_infos[frameId];
        }
      this.needUpdate = true;
      }
    }
  }


  var Pose = TfClient.Pose = function( position, orientation ) {
    this.position = new Vector3;
    this.orientation = new Quaternion;
    if ( position !== undefined ) {
      this.position.copy( position );
    }
    if ( orientation !== undefined ) {
      this.orientation.copy( orientation );
    }
  };

  Pose.prototype = {
    constructor: Pose,
    copy: function( pose ) {
      this.position.copy( pose.position );
      this.orientation.copy( pose.orientation );
    }
  }

  var Transform = TfClient.Transform = function( translation, rotation ) {
    this.translation = new Vector3;
    this.rotation = new Quaternion;
    if ( translation !== undefined ) {
      this.translation.copy( translation );
    }
    if ( rotation !== undefined ) {
      this.rotation.copy( rotation );
    }
  };

  Transform.prototype = {
    constructor: Transform,
    apply: function( pose ) {
      this.rotation.multiplyVec3(pose.position);
      pose.position.add(pose.position,this.translation);
      pose.orientation.multiply(this.rotation, pose.orientation);
      return pose;
    },
    applyInverse: function( pose ) {
      var rotInv = this.rotation.clone().inverse();
      rotInv.multiplyVec3(pose.position);
      pose.position.sub(pose.position,this.translation);
      pose.orientation.multiply(rotInv, pose.orientation);
      return pose;
    },
    copy: function( transform ) {
      this.translation.copy( transform.translation );
      this.rotation.copy( transform.rotation );
    }
  }

  var Quaternion = TfClient.Quaternion = function( x, y, z, w ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = ( w !== undefined ) ? w : 1;
  };

  Quaternion.prototype = {
    constructor: Quaternion,
    copy: function ( q ) {
      this.x = q.x;
      this.y = q.y;
      this.z = q.z;
      this.w = q.w;
      return this;
    },
    inverse: function () {
      this.conjugate().normalize();
      return this;
    },
    conjugate: function () {
      this.x *= -1;
      this.y *= -1;
      this.z *= -1;
      return this;
    },
    normalize: function () {
      var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );
      if ( l === 0 ) {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 1;
      } else {
        l = 1 / l;
        this.x = this.x * l;
        this.y = this.y * l;
        this.z = this.z * l;
        this.w = this.w * l;
      }
      return this;
    },
    multiply: function ( a, b ) {
      var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w,
      qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
      this.x =  qax * qbw + qay * qbz - qaz * qby + qaw * qbx;
      this.y = -qax * qbz + qay * qbw + qaz * qbx + qaw * qby;
      this.z =  qax * qby - qay * qbx + qaz * qbw + qaw * qbz;
      this.w = -qax * qbx - qay * qby - qaz * qbz + qaw * qbw;
      return this;
    },
    multiplyVec3: function ( vector, dest ) {
      if ( !dest ) { dest = vector; }
      var x    = vector.x,  y  = vector.y,  z  = vector.z,
        qx   = this.x, qy = this.y, qz = this.z, qw = this.w;
      var ix =  qw * x + qy * z - qz * y,
        iy =  qw * y + qz * x - qx * z,
        iz =  qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;
      dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
      dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
      dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
      return dest;
    },
    clone: function () {
      return new Quaternion( this.x, this.y, this.z, this.w );
    }
  }

  var Vector3 = TfClient.Vector3 = function ( x, y, z ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  };

  Vector3.prototype = {
    constructor: Vector3,
    copy: function ( v ) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    },
    add: function ( a, b ) {
      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;
      return this;
    },
    sub: function ( a, b ) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    },
    clone: function () {
      return new Vector3( this.x, this.y, this.z );
    }
  };

  return TfClient;
}));
