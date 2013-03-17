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
  var actionClient = this;
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
      var goal = actionClient.goals[status.goal_id.id];
      if (goal) {
        goal.emit('status', status);
      }
    });
  });

  // subscribe the the feedback topic
  feedbackListener.subscribe(function(feedbackMessage) {
    var goal = actionClient.goals[feedbackMessage.status.goal_id.id];
    if (goal) {
      goal.emit('status', feedbackMessage.status);
      goal.emit('feedback', feedbackMessage.feedback);
    }
  });

  // subscribe to the result topic
  resultListener.subscribe(function(resultMessage) {
    var goal = actionClient.goals[resultMessage.status.goal_id.id];

    if (goal) {
      goal.emit('status', resultMessage.status);
      goal.emit('result', resultMessage.result);
    }
  });

  // If timeout specified, emit a 'timeout' event if the action server does not respond
  if (this.timeout) {
    setTimeout(function() {
      if (!receivedStatus) {
        actionClient.emit('timeout');
      }
    }, this.timeout);
  }
};
ROSLIB.ActionClient.prototype.__proto__ = EventEmitter2.prototype;
/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * An actionlib goal goal is associated with an action server.
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
  var goal = this;
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
    goal.actionClient.goalTopic.publish(goal.goalMessage);
    if (timeout) {
      setTimeout(function() {
        if (!goal.isFinished) {
          goal.emit('timeout');
        }
      }, timeout);
    }
  };

  /**
   * Cancel the current goal.
   */
  this.cancel = function() {
    var cancelMessage = new ROSLIB.Message({
      id : goal.goalID
    });
    goal.actionClient.cancelTopic.publish(cancelMessage);
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
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the param name, like max_vel_x
 */
ROSLIB.Param = function(options) {
  var param = this;
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;

  /**
   * Fetches the value of the param.
   *
   * @param callback - function with the following params:
   *  * value - the value of the param from ROS.
   */
  this.get = function(callback) {
    var paramClient = new ROSLIB.Service({
      ros : param.ros,
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
  this.set = function(value) {
    var paramClient = new ROSLIB.Service({
      ros : param.ros,
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
    service.ros.idCounter++;
    serviceCallId = 'call_service:' + service.name + ':' + service.ros.idCounter;

    service.ros.once(serviceCallId, function(data) {
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
    service.ros.callOnConnection(call);
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
  var topic = this;
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
    topic.on('message', function(message) {
      callback(message);
    });

    topic.ros.on(topic.name, function(data) {
      var message = new ROSLIB.Message(data);
      topic.emit('message', message);
    });

    topic.ros.idCounter++;
    var subscribeId = 'subscribe:' + topic.name + ':' + topic.ros.idCounter;
    var call = {
      op : 'subscribe',
      id : subscribeId,
      type : topic.messageType,
      topic : topic.name,
      compression : topic.compression,
      throttle_rate : topic.throttle_rate
    };

    topic.ros.callOnConnection(call);
  };

  /**
   * Unregisters as a subscriber for the topic. Unsubscribing will remove
   * all subscribe callbacks.
   */
  this.unsubscribe = function() {
    topic.ros.removeAllListeners([ topic.name ]);
    topic.ros.idCounter++;
    var unsubscribeId = 'unsubscribe:' + topic.name + ':' + topic.ros.idCounter;
    var call = {
      op : 'unsubscribe',
      id : unsubscribeId,
      topic : topic.name
    };
    topic.ros.callOnConnection(call);
  };

  /**
   * Registers as a publisher for the topic.
   */
  this.advertise = function() {
    topic.ros.idCounter++;
    var advertiseId = 'advertise:' + topic.name + ':' + topic.ros.idCounter;
    var call = {
      op : 'advertise',
      id : advertiseId,
      type : topic.messageType,
      topic : topic.name
    };
    topic.ros.callOnConnection(call);
    topic.isAdvertised = true;
  };

  /**
   * Unregisters as a publisher for the topic.
   */
  this.unadvertise = function() {
    topic.ros.idCounter++;
    var unadvertiseId = 'unadvertise:' + topic.name + ':' + topic.ros.idCounter;
    var call = {
      op : 'unadvertise',
      id : unadvertiseId,
      topic : topic.name
    };
    topic.ros.callOnConnection(call);
    topic.isAdvertised = false;
  };

  /**
   * Publish the message.
   *
   * @param message - A ROSLIB.Message object.
   */
  this.publish = function(message) {
    if (!topic.isAdvertised) {
      topic.advertise();
    }

    topic.ros.idCounter++;
    var publishId = 'publish:' + topic.name + ':' + topic.ros.idCounter;
    var call = {
      op : 'publish',
      id : publishId,
      topic : topic.name,
      msg : message
    };
    topic.ros.callOnConnection(call);
  };
};
ROSLIB.Topic.prototype.__proto__ = EventEmitter2.prototype;
/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Pose in 3D space. Values are copied into this object.
 *
 *  @constructor
 *  @param position - the ROSLIB.Vector3 describing the position
 *  @param orientation - the ROSLIB.Quaternion describing the orientation
 */
ROSLIB.Pose = function(position, orientation) {
  var pose = this;
  // copy the values into this object if they exist
  this.position = new ROSLIB.Vector3();
  this.orientation = new ROSLIB.Quaternion();
  if (position !== undefined) {
    this.position.copy(position);
  }
  if (orientation !== undefined) {
    this.orientation.copy(orientation);
  }

  /**
   * Copy the values from the given pose into this pose.
   * 
   * @param pose the pose to copy
   * @returns a pointer to this pose
   */
  this.copy = function(pose) {
    pose.position.copy(pose.position);
    pose.orientation.copy(pose.orientation);
    return pose;
  };
};
/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Quaternion.
 *
 *  @constructor
 *  @param x - the x value 
 *  @param y - the y value
 *  @param z - the z value
 *  @param w - the w value
 */
ROSLIB.Quaternion = function(x, y, z, w) {
  var quaternion = this;
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = w || 1;

  /**
   * Copy the values from the given quaternion into this quaternion.
   * 
   * @param q the quaternion to copy
   * @returns a pointer to this quaternion
   */
  this.copy = function(q) {
    quaternion.x = q.x;
    quaternion.y = q.y;
    quaternion.z = q.z;
    quaternion.w = q.w;
    return quaternion;
  };

  /**
   * Perform a conjugation on this quaternion.
   * 
   * @returns a pointer to this quaternion
   */
  this.conjugate = function() {
    quaternion.x *= -1;
    quaternion.y *= -1;
    quaternion.z *= -1;
    return quaternion;
  };

  /**
   * Perform a normalization on this quaternion.
   * 
   * @returns a pointer to this quaternion
   */
  this.normalize = function() {
    var l = Math.sqrt(quaternion.x * quaternion.x + quaternion.y * quaternion.y + quaternion.z
        * quaternion.z + quaternion.w * quaternion.w);
    if (l === 0) {
      quaternion.x = 0;
      quaternion.y = 0;
      quaternion.z = 0;
      quaternion.w = 1;
    } else {
      l = 1 / l;
      quaternion.x = quaternion.x * l;
      quaternion.y = quaternion.y * l;
      quaternion.z = quaternion.z * l;
      quaternion.w = quaternion.w * l;
    }
    return quaternion;
  };

  /**
   * Convert this quaternion into its inverse.
   * 
   * @returns a pointer to this quaternion
   */
  this.inverse = function() {
    this.conjugate().normalize();
    return quaternion;
  };

  /**
   * Set the values of this quaternion to the product of quaternions a and b.
   * 
   * @param a the first quaternion to multiply with
   * @param b the second quaternion to multiply with
   * @returns a pointer to this quaternion
   */
  this.multiply = function(a, b) {
    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w, qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
    this.x = qax * qbw + qay * qbz - qaz * qby + qaw * qbx;
    this.y = -qax * qbz + qay * qbw + qaz * qbx + qaw * qby;
    this.z = qax * qby - qay * qbx + qaz * qbw + qaw * qbz;
    this.w = -qax * qbx - qay * qby - qaz * qbz + qaw * qbw;
    return quaternion;
  };

  /**
   * Multiply the given ROSLIB.Vector3 with this quaternion.
   * 
   * @param vector the vector to multiply with
   * @param dest (option) - where the computed values will go (defaults to 'vector').
   * @returns a pointer to dest
   */
  this.multiplyVec3 = function(vector, dest) {
    if (!dest) {
      dest = vector;
    }
    var x = vector.x, y = vector.y, z = vector.z, qx = quaternion.x, qy = quaternion.y, qz = quaternion.z, qw = quaternion.w;
    var ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx
        * x - qy * y - qz * z;
    dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return dest;
  };

  /**
   * Clone a copy of this quaternion.
   * 
   * @returns the cloned quaternion
   */
  this.clone = function() {
    return new ROSLIB.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  };
};
/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A 3D vector.
 *
 *  @constructor
 *  @param x - the x value 
 *  @param y - the y value
 *  @param z - the z value
 */
ROSLIB.Vector3 = function(x, y, z) {
  var vector3 = this;
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;

  /**
   * Copy the values from the given vector into this vector.
   * 
   * @param v the vector to copy
   * @returns a pointer to this vector
   */
  this.copy = function(v) {
    vector3.x = v.x;
    vector3.y = v.y;
    vector3.z = v.z;
    return vector3;
  };

  /**
   * Set the values of this vector to the sum of vectors a and b.
   * 
   * @param a the first vector to add with
   * @param b the second vector to add with
   * @returns a pointer to this vector
   */
  this.add = function(a, b) {
    vector3.x = a.x + b.x;
    vector3.y = a.y + b.y;
    vector3.z = a.z + b.z;
    return vector3;
  };

  /**
   * Set the values of this vector to the difference of vectors a and b.
   * 
   * @param a the first vector to add with
   * @param b the second vector to add with
   * @returns a pointer to this vector
   */
  this.sub = function(a, b) {
    vector3.x = a.x - b.x;
    vector3.y = a.y - b.y;
    vector3.z = a.z - b.z;
    return vector3;
  };

  /**
   * Clone a copy of this vector.
   * 
   * @returns the cloned vector
   */
  this.clone = function() {
    return new ROSLIB.Vector3(vector3.x, vector3.y, vector3.z);
  };
};
/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * fixedFrame - the fixed frame, like /base_link
 *   * angularThres - the angular threshold for the TF republisher
 *   * transThres - the translation threshold for the TF republisher
 *   * rate - the rate for the TF republisher
 *   * goalUpdateDelay - the goal update delay for the TF republisher
 */
ROSLIB.TFClient = function(options) {
  var tfClient = this;
  var options = options || {};
  this.ros = options.ros;
  this.fixedFrame = options.fixedFrame || '/base_link';
  this.angularThres = options.angularThres || 2.0;
  this.transThres = options.transThres || 0.01;
  this.rate = options.rate || 10.0;
  this.goalUpdateDelay = options.goalUpdateDelay || 50;

  this.currentGoal = false;
  this.frameInfos = {};
  this.goalUpdateRequested = false;

  // create an ActionClient
  this.actionClient = new ROSLIB.ActionClient({
    ros : this.ros,
    serverName : '/tf2_web_republisher',
    actionName : 'tf2_web_republisher/TFSubscriptionAction'
  });

  /**
   * Process the incoming TF message and send them out using the callback functions.
   * 
   * @param tf - the TF message from the server
   */
  this.processFeedback = function(tf) {
    tf.transforms.forEach(function(transform) {
      var frameID = transform.child_frame_id;
      var info = tfClient.frameInfos[frameID];
      if (info != undefined) {
        info.transform = new ROSLIB.Transform(transform.transform.translation,
            transform.transform.rotation);
        info.cbs.forEach(function(cb) {
          cb(info.transform);
        });
      }
    });
  };

  /**
   * Create and send a new goal to the tf2_web_republisher based on the current list of TFs.
   */
  this.updateGoal = function() {
    // Anytime the list of frames changes, we will need to send a new goal.
    if (tfClient.currentGoal) {
      tfClient.currentGoal.cancel();
    }

    var goalMessage = {
      source_frames : [],
      target_frame : tfClient.fixedFrame,
      angular_thres : tfClient.angularThres,
      trans_thres : tfClient.transThres,
      rate : tfClient.rate
    };

    for (frame in tfClient.frameInfos) {
      goalMessage.source_frames.push(frame);
    }

    tfClient.currentGoal = new ROSLIB.Goal({
      actionClient : tfClient.actionClient,
      goalMessage : goalMessage
    });
    tfClient.currentGoal.on('feedback', tfClient.processFeedback.bind(tfClient));
    tfClient.currentGoal.send();
    tfClient.goalUpdateRequested = false;
  };

  /**
   * Subscribe to the given TF frame.
   * 
   * @param frameID - the TF frame to subscribe to
   * @param callback - function with params:
   *   * transform - the transform data
   */
  this.subscribe = function(frameID, callback) {
    // make sure the frame id is relative
    if (frameID[0] === '/') {
      frameID = frameID.substring(1);
    }
    // if there is no callback registered for the given frame, create emtpy callback list
    if (tfClient.frameInfos[frameID] == undefined) {
      tfClient.frameInfos[frameID] = {
        cbs : []
      };
      if (!tfClient.goalUpdateRequested) {
        setTimeout(tfClient.updateGoal.bind(tfClient), tfClient.goalUpdateDelay);
        tfClient.goalUpdateRequested = true;
      }
    } else {
      // if we already have a transform, call back immediately
      if (tfClient.frameInfos[frameID].transform != undefined) {
        callback(tfClient.frameInfos[frameID].transform);
      }
    }
    tfClient.frameInfos[frameID].cbs.push(callback);
  };

  /**
   * Unsubscribe from the given TF frame.
   * 
   * @param frameID - the TF frame to unsubscribe from
   * @param callback - the callback function to remove
   */
  this.unsubscribe = function(frameID, callback) {
    var info = tfClient.frameInfos[frameID];
    if (info != undefined) {
      var cbIndex = info.cbs.indexOf(callback);
      if (cbIndex >= 0) {
        info.cbs.splice(cbIndex, 1);
        if (info.cbs.length == 0) {
          delete tfClient.frameInfos[frameID];
        }
        tfClient.needUpdate = true;
      }
    }
  };
};
/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Transform in 3-space. Values are copied into this object.
 *
 *  @constructor
 *  @param translation - the ROSLIB.Vector3 describing the translation
 *  @param rotation - the ROSLIB.Quaternion describing the rotation
 */
ROSLIB.Transform = function(translation, rotation) {
  var transform = this;
  // copy the values into this object if they exist
  this.translation = new ROSLIB.Vector3();
  this.rotation = new ROSLIB.Quaternion();
  if (translation !== undefined) {
    this.translation.copy(translation);
  }
  if (rotation !== undefined) {
    this.rotation.copy(rotation);
  }

  /**
   * Apply a transform against the given ROSLIB.Pose.
   * 
   * @param pose the pose to transform with
   * @returns a pointer to the pose
   */
  this.apply = function(pose) {
    transform.rotation.multiplyVec3(pose.position);
    pose.position.add(pose.position, transform.translation);
    pose.orientation.multiply(transform.rotation, pose.orientation);
    return pose;
  };

  /**
   * Apply an inverse transform against the given ROSLIB.Pose.
   * 
   * @param pose the pose to transform with
   * @returns a pointer to the pose
   */
  this.applyInverse = function(pose) {
    var rotInv = transform.rotation.clone().inverse();
    rotInv.multiplyVec3(pose.position);
    pose.position.sub(pose.position, transform.translation);
    pose.orientation.multiply(rotInv, pose.orientation);
    return pose;
  };

  /**
   * Copy the values from the given transform into this transform.
   * 
   * @param transform the transform to copy
   * @returns a pointer to this transform
   */
  this.copy = function(transform) {
    transform.translation.copy(transform.translation);
    transform.rotation.copy(transform.rotation);
    return transform;
  };
};
