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
