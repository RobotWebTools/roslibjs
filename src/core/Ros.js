/**
 * Ros.js can be included using <script src="ros.js"> or AMD.  The next few
 * lines provide support for both formats and are based on the Universal Module
 * Definition.
 *
 * @see AMD - http://bryanforbes.github.com/amd-commonjs-modules-presentation/2011-10-29/
 * @see UMD - https://github.com/umdjs/umd/blob/master/amdWeb.js
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['eventemitter2'], factory);
  }
  else {
    root.ROS = factory(root.EventEmitter2);
  }
}(this, function (EventEmitter2) {

  /**
   * Manages connection to the server and all interactions with
   * ROS.
   *
   * Emits the following events:
   *  * 'error' - there was an error with ROS
   *  * 'connection' - connected to the WebSocket server
   *  * 'close' - disconnected to the WebSocket server
   *
   *  @constructor
   *  @param url (optional) - The WebSocket URL for rosbridge. Can be specified
   *    later with `connect`.
   */
  var ROS = function(url) {
    var ros = this;
    ros.socket = null;

    // Provides a unique ID for each message sent to the server.
    ros.idCounter = 0;

    // Socket Handling
    // ---------------

    /**
     * Emits a 'connection' event on WebSocket connection.
     */
    function onOpen(event) {
      ros.emit('connection', event);
    };

    /**
     * Emits a 'close' event on WebSocket disconnection.
     */
    function onClose(event) {
      ros.emit('close', event);
    };

    /**
     * Emits an 'error' event whenever there was an error.
     */
    function onError(event) {
      ros.emit('error', event);
    };

    /**
     * If a message was compressed as a PNG image (a compression hack since
     * gzipping over WebSockets is not supported yet), this function places the
     * "image" in a canvas element then decodes the "image" as a Base64 string.
     *
     * @param data - object containing the PNG data.
     * @param callback function with params:
     *   * data - the uncompressed data
     */
    function decompressPng(data, callback) {
      // Uncompresses the data before sending it through (use image/canvas to do so).
      var image = new Image();
      // When the image loads, extracts the raw data (JSON message).
      image.onload = function() {
        // Creates a local canvas to draw on.
        var canvas  = document.createElement('canvas');
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
        for (var i = 0; i < imageData.length; i += 4) {
          // RGB
          jsonData += String.fromCharCode(imageData[i], imageData[i+1], imageData[i+2]);
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
          ros.emit(message.topic, message.msg);
        }
        else if (message.op === 'service_response') {
          ros.emit(message.id, message.values);
        }
      };

      var data = JSON.parse(message.data);
      if (data.op === 'png') {
        decompressPng(data, function(decompressedData) {
          handleMessage(decompressedData);
        });
      }
      else {
        handleMessage(data);
      }
    };

    /**
     * Sends the message over the WebSocket, but queues the message up if not
     * yet connected.
     */
    function callOnConnection(message) {
      var messageJson = JSON.stringify(message);

      if (ros.socket.readyState !== WebSocket.OPEN) {
        ros.once('connection', function() {
          ros.socket.send(messageJson);
        });
      }
      else {
        ros.socket.send(messageJson);
      }
    };

    /**
     * Connect to the specified WebSocket.
     *
     * @param url - WebSocket URL for Rosbridge
     */
    ros.connect = function(url) {
      ros.socket = new WebSocket(url);
      ros.socket.onopen    = onOpen;
      ros.socket.onclose   = onClose;
      ros.socket.onerror   = onError;
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

    if (url) {
      ros.connect(url);
    }

    // Topics
    // ------

    /**
     * Retrieves list of topics in ROS as an array.
     *
     * @param callback function with params:
     *   * topics - Array of topic names
     */
    ros.getTopics = function(callback) {
      var topicsClient = new ros.Service({
        name        : '/rosapi/topics',
        serviceType : 'rosapi/Topics'
      });

      var request = new ros.ServiceRequest();

      topicsClient.callService(request, function(result) {
        callback(result.topics);
      });
    };

    /**
     * Message objects are used for publishing and subscribing to and from
     * topics.
     * @param values - object matching the fields defined in the .msg
     *   definition file.
     */
    ros.Message = function(values) {
      var message = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          message[name] = values[name];
        });
      }
    };

    /**
     * Publish and/or subscribe to a topic in ROS.
     *
     * @constructor
     * @param options - object with following keys:
     *   * node - the name of the node to register under
     *   * name - the topic name, like /cmd_vel
     *   * messageType - the message type, like 'std_msgs/String'
     */
    ros.Topic = function(options) {
      var topic          = this;
      options            = options || {};
      topic.node         = options.node;
      topic.name         = options.name;
      topic.messageType  = options.messageType;
      topic.isAdvertised = false;
      topic.compression  = options.compression || 'none';
      topic.throttle_rate = options.throttle_rate || 0;

      // Check for valid compression types
      if (topic.compression && topic.compression !== 'png' && topic.compression !== 'none') {
        topic.emit('warning', topic.compression + ' compression is not supported. No comression will be used.');
      }

      // Check if throttle rate is negative
      if (topic.throttle_rate < 0) {
        topic.emit('warning',topic.throttle_rate + ' is not allowed. Set to 0');
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
          var message = new ros.Message(data);
          topic.emit('message', message);
        });

        ros.idCounter++;
        var subscribeId = 'subscribe:' + topic.name + ':' + ros.idCounter;
        var call = {
          op          : 'subscribe',
          id          : subscribeId,
          type        : topic.messageType,
          topic       : topic.name,
          compression : topic.compression,
          throttle_rate : topic.throttle_rate
        };

        callOnConnection(call);
      };

      /**
       * Unregisters as a subscriber for the topic. Unsubscribing will remove
       * all subscribe callbacks.
       */
      topic.unsubscribe = function() {
        ros.removeAllListeners([topic.name]);
        ros.idCounter++;
        var unsubscribeId = 'unsubscribe:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'unsubscribe',
          id    : unsubscribeId,
          topic : topic.name
        };
        callOnConnection(call);
      };

      /**
       * Registers as a publisher for the topic.
       */
      topic.advertise = function() {
        ros.idCounter++;
        var advertiseId = 'advertise:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'advertise',
          id    : advertiseId,
          type  : topic.messageType,
          topic : topic.name
        };
        callOnConnection(call);
        topic.isAdvertised = true;
      };

      /**
       * Unregisters as a publisher for the topic.
       */
      topic.unadvertise = function() {
        ros.idCounter++;
        var unadvertiseId = 'unadvertise:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'unadvertise',
          id    : unadvertiseId,
          topic : topic.name
        };
        callOnConnection(call);
        topic.isAdvertised = false;
      };

      /**
       * Publish the message.
       *
       * @param message - A ROS.Message object.
       */
      topic.publish = function(message) {
        if (!topic.isAdvertised) {
          topic.advertise();
        }

        ros.idCounter++;
        var publishId = 'publish:' + topic.name + ':' + ros.idCounter;
        var call = {
          op    : 'publish',
          id    : publishId,
          topic : topic.name,
          msg   : message
        };
        callOnConnection(call);
      };
    };
    ros.Topic.prototype.__proto__ = EventEmitter2.prototype;

    // Services
    // --------

    /**
     * Retrieves list of active service names in ROS.
     *
     * @constructor
     * @param callback - function with the following params:
     *   * services - array of service names
     */
    ros.getServices = function(callback) {
      var servicesClient = new ros.Service({
        name        : '/rosapi/services',
        serviceType : 'rosapi/Services'
      });

      var request = new ros.ServiceRequest();

      servicesClient.callService(request, function(result) {
        callback(result.services);
      });
    };

    /**
     * A ServiceRequest is passed into the service call.
     *
     * @constructor
     * @param values - object matching the values of the request part from the
     *   .srv file.
     */
    ros.ServiceRequest = function(values) {
      var serviceRequest = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          serviceRequest[name] = values[name];
        });
      }
    };

    /**
     * A ServiceResponse is returned from the service call.
     *
     * @param values - object matching the values of the response part from the
     *   .srv file.
     */
    ros.ServiceResponse = function(values) {
      var serviceResponse = this;
      if (values) {
        Object.keys(values).forEach(function(name) {
          serviceResponse[name] = values[name];
        });
      }
    };

    /**
     * A ROS service client.
     *
     * @constructor
     * @params options - possible keys include:
     *   * name - the service name, like /add_two_ints
     *   * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
     */
    ros.Service = function(options) {
      var service         = this;
      options             = options || {};
      service.name        = options.name;
      service.serviceType = options.serviceType;

      // Calls the service. Returns the service response in the callback.
      service.callService = function(request, callback) {
        ros.idCounter++;
        serviceCallId = 'call_service:' + service.name + ':' + ros.idCounter;

        ros.once(serviceCallId, function(data) {
          var response = new ros.ServiceResponse(data);
          callback(response);
        });

        var requestValues = [];
        Object.keys(request).forEach(function(name) {
          requestValues.push(request[name]);
        });

        var call = {
          op      : 'call_service',
          id      : serviceCallId,
          service : service.name,
          args    : requestValues
        };
        callOnConnection(call);
      };
    };
    ros.Service.prototype.__proto__ = EventEmitter2.prototype;

    // Params
    // ------

    /**
     * Retrieves list of param names from the ROS Parameter Server.
     *
     * @param callback function with params:
     *  * params - array of param names.
     */
    ros.getParams = function(callback) {
      var paramsClient = new ros.Service({
        name        : '/rosapi/get_param_names'
      , serviceType : 'rosapi/GetParamNames'
      });

      var request = new ros.ServiceRequest();
      paramsClient.callService(request, function(result) {
        callback(result.names);
      });
    };

    /**
     * A ROS param.
     *
     * @constructor
     * @param options - possible keys include:
     *   *name - the param name, like max_vel_x
     */
    ros.Param = function(options) {
      var param  = this;
      options    = options || {};
      param.name = options.name;

      /**
       * Fetches the value of the param.
       *
       * @param callback - function with the following params:
       *  * value - the value of the param from ROS.
       */
      param.get = function(callback) {
        var paramClient = new ros.Service({
          name        : '/rosapi/get_param',
          serviceType : 'rosapi/GetParam'
        });

        var request = new ros.ServiceRequest({
          name  : param.name,
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
        var paramClient = new ros.Service({
          name        : '/rosapi/set_param',
          serviceType : 'rosapi/SetParam'
        });

        var request = new ros.ServiceRequest({
          name: param.name,
          value: JSON.stringify(value)
        });

        paramClient.callService(request, function() {});
      };
    };
    ros.Param.prototype.__proto__ = EventEmitter2.prototype;
    
    // Auth
    // ------
    
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
        op     : 'auth',
        mac    : mac,
        client : client,
        dest   : dest,
        rand   : rand,
        t      : t,
        level  : level,
        end    : end
      };
      // send the request
      callOnConnection(auth);
    };
  };
  ROS.prototype.__proto__ = EventEmitter2.prototype;

  return ROS;
}));

