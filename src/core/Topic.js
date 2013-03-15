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
