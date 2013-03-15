/**
 * @author Russell Toris - rctoris@wpi.edu
 */

var ROSLIB = ROSLIB || {
  REVISION : '1'
};
(function (root, factory) {
    if(typeof define === 'function' && define.amd) {
        define(['eventemitter2'],factory);
    }
    else {
        root.ActionClient = factory(root.EventEmitter2);
    }
}(this, function(EventEmitter2) {

var ActionClient = function(options) {
  var actionClient = this;
  options = options || {};
  actionClient.ros         = options.ros;
  actionClient.serverName  = options.serverName;
  actionClient.actionName  = options.actionName;
  actionClient.timeout     = options.timeout;
  actionClient.goals       = {};

  actionClient.goalTopic = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/goal'
  , messageType : actionClient.actionName + 'Goal'
  });
  actionClient.goalTopic.advertise();

  actionClient.cancelTopic = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/cancel'
  , messageType : 'actionlib_msgs/GoalID'
  });
  actionClient.cancelTopic.advertise();

  var receivedStatus = false;
  var statusListener = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/status'
  , messageType : 'actionlib_msgs/GoalStatusArray'
  });
  statusListener.subscribe(function (statusMessage) {
    receivedStatus = true;

    statusMessage.status_list.forEach(function(status) {
      var goal = actionClient.goals[status.goal_id.id];
      if (goal) {
        goal.emit('status', status);
      }
    });
  });

  // If timeout specified, emit a 'timeout' event if the ActionServer does not
  // respond before the timeout.
  if (actionClient.timeout) {
    setTimeout(function() {
      if (!receivedStatus) {
        actionClient.emit('timeout');
      }
    }, actionClient.timeout);
  }

  // Subscribe to the feedback, and result topics
  var feedbackListener = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/feedback'
  , messageType : actionClient.actionName + 'Feedback'
  });
  feedbackListener.subscribe(function (feedbackMessage) {
    var goal = actionClient.goals[feedbackMessage.status.goal_id.id];

    if (goal) {
      goal.emit('status', feedbackMessage.status);
      goal.emit('feedback', feedbackMessage.feedback);
    }
  });

  var resultListener = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/result'
  , messageType : actionClient.actionName + 'Result'
  });
  resultListener.subscribe(function (resultMessage) {
    var goal = actionClient.goals[resultMessage.status.goal_id.id];

    if (goal) {
      goal.emit('status', resultMessage.status);
      goal.emit('result', resultMessage.result);
    }
  });

  actionClient.cancel = function() {
    var cancelMessage = new actionClient.ros.Message({});
    actionClient.cancelTopic.publish(cancelMessage);
  };

  actionClient.Goal = function(goalMsg) {
    var goal = this;

    goal.isFinished = false;
    goal.status;
    goal.result;
    goal.feedback;

    var date = new Date();
    goal.goalId = 'goal_' + Math.random() + "_" + date.getTime();
    goal.goalMessage = new actionClient.ros.Message({
      goal_id : {
        stamp: {
          secs  : 0
        , nsecs : 0
        }
      , id: goal.goalId
      }
    , goal: goalMsg
    });

    goal.on('status', function(status) {
      goal.status = status;
    });

    goal.on('result', function(result) {
      goal.isFinished = true;
      goal.result = result;
    });

    goal.on('feedback', function(feedback) {
      goal.feedback = feedback;
    });

    actionClient.goals[goal.goalId] = this;

    goal.send = function(timeout) {
      actionClient.goalTopic.publish(goal.goalMessage);
      if (timeout) {
         setTimeout(function() {
           if (!goal.isFinished) {
             goal.emit('timeout');
           }
         }, timeout);
      }
    };

    goal.cancel = function() {
      var cancelMessage = new actionClient.ros.Message({
        id: goal.goalId
      });
      actionClient.cancelTopic.publish(cancelMessage);
    };
  };
  actionClient.Goal.prototype.__proto__ = EventEmitter2.prototype;

};
ActionClient.prototype.__proto__ = EventEmitter2.prototype;
return ActionClient;
}
));
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
  var message = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      message[name] = values[name];
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
  var param = this;
  options = options || {};
  param.name = options.name;

  /**
   * Fetches the value of the param.
   *
   * @param callback - function with the following params:
   *  * value - the value of the param from ROS.
   */
  param.get = function(callback) {
    var paramClient = new ROSLIB.Service({
      name : '/rosapi/get_param',
      serviceType : 'rosapi/GetParam'
    });

    var request = new ROSLIB.ServiceRequest({
      name : param.name,
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
  param.set = function(value) {
    var paramClient = new ROSLIB.Service({
      name : '/rosapi/set_param',
      serviceType : 'rosapi/SetParam'
    });

    var request = new ROSLIB.ServiceRequest({
      name : param.name,
      value : JSON.stringify(value)
    });

    paramClient.callService(request, function() {
    });
  };
};
ROSLIB.Param.prototype.__proto__ = EventEmitter2.prototype;
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
 *
 *  @constructor
 *  @param url (optional) - The WebSocket URL for rosbridge. Can be specified later with `connect`.
 */
ROSLIB.Ros = function(url) {
  var ros = this;
  ros.socket = null;

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
  ros.connect = function(url) {
    ros.socket = new WebSocket(url);
    ros.socket.onopen = onOpen;
    ros.socket.onclose = onClose;
    ros.socket.onerror = onError;
    ros.socket.onmessage = onMessage;
  };

  /**
   * Disconnect from the WebSocket server.
   */
  ros.close = function() {
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
  ros.authenticate = function(mac, client, dest, rand, t, level, end) {
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
  ros.callOnConnection = function(message) {
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
  ros.getTopics = function(callback) {
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
  ros.getServices = function(callback) {
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
  ros.getParams = function(callback) {
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
    ros.connect(url);
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
  var service = this;
  options = options || {};
  service.ros = options.ros;
  service.name = options.name;
  service.serviceType = options.serviceType;

  /**
   * Calls the service. Returns the service response in the callback.
   * 
   * @param request - the ROSLIB.ServiceRequest to send
   * @param callback - function with params:
   *   * response - the response from the service request
   */
  service.callService = function(request, callback) {
    ros.idCounter++;
    serviceCallId = 'call_service:' + service.name + ':' + ros.idCounter;

    ros.once(serviceCallId, function(data) {
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
      service : service.name,
      args : requestValues
    };
    ros.callOnConnection(call);
  };
};
ROSLIB.Service.prototype.__proto__ = EventEmitter2.prototype;
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
  var serviceRequest = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      serviceRequest[name] = values[name];
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
  var serviceResponse = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      serviceResponse[name] = values[name];
    });
  }
};
/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * Publish and/or subscribe to a topic in ROS.
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
  var topic = this;
  options = options || {};
  topic.ros = options.ros;
  topic.name = options.name;
  topic.messageType = options.messageType;
  topic.isAdvertised = false;
  topic.compression = options.compression || 'none';
  topic.throttle_rate = options.throttle_rate || 0;

  // Check for valid compression types
  if (topic.compression && topic.compression !== 'png' && topic.compression !== 'none') {
    topic.emit('warning', topic.compression
        + ' compression is not supported. No comression will be used.');
  }

  // Check if throttle rate is negative
  if (topic.throttle_rate < 0) {
    topic.emit('warning', topic.throttle_rate + ' is not allowed. Set to 0');
    topic.throttle_rate = 0;
  }

  /**
   * Every time a message is published for the given topic, the callback
   * will be called with the message object.
   *
   * @param callback - function with the following params:
   *   * message - the published message
   */
  topic.subscribe = function(callback) {
    topic.on('message', function(message) {
      callback(message);
    });

    ros.on(topic.name, function(data) {
      var message = new ROSLIB.Message(data);
      topic.emit('message', message);
    });

    ros.idCounter++;
    var subscribeId = 'subscribe:' + topic.name + ':' + ros.idCounter;
    var call = {
      op : 'subscribe',
      id : subscribeId,
      type : topic.messageType,
      topic : topic.name,
      compression : topic.compression,
      throttle_rate : topic.throttle_rate
    };

    ros.callOnConnection(call);
  };

  /**
   * Unregisters as a subscriber for the topic. Unsubscribing will remove
   * all subscribe callbacks.
   */
  topic.unsubscribe = function() {
    ros.removeAllListeners([ topic.name ]);
    ros.idCounter++;
    var unsubscribeId = 'unsubscribe:' + topic.name + ':' + ros.idCounter;
    var call = {
      op : 'unsubscribe',
      id : unsubscribeId,
      topic : topic.name
    };
    ros.callOnConnection(call);
  };

  /**
   * Registers as a publisher for the topic.
   */
  topic.advertise = function() {
    ros.idCounter++;
    var advertiseId = 'advertise:' + topic.name + ':' + ros.idCounter;
    var call = {
      op : 'advertise',
      id : advertiseId,
      type : topic.messageType,
      topic : topic.name
    };
    ros.callOnConnection(call);
    topic.isAdvertised = true;
  };

  /**
   * Unregisters as a publisher for the topic.
   */
  topic.unadvertise = function() {
    ros.idCounter++;
    var unadvertiseId = 'unadvertise:' + topic.name + ':' + ros.idCounter;
    var call = {
      op : 'unadvertise',
      id : unadvertiseId,
      topic : topic.name
    };
    ros.callOnConnection(call);
    topic.isAdvertised = false;
  };

  /**
   * Publish the message.
   *
   * @param message - A ROSLIB.Message object.
   */
  topic.publish = function(message) {
    if (!topic.isAdvertised) {
      topic.advertise();
    }

    ros.idCounter++;
    var publishId = 'publish:' + topic.name + ':' + ros.idCounter;
    var call = {
      op : 'publish',
      id : publishId,
      topic : topic.name,
      msg : message
    };
    ros.callOnConnection(call);
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
