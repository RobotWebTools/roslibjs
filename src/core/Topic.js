/**
 * @author Brandon Alexander - baalexander@gmail.com
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
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.messageType = options.messageType;
  this.isAdvertised = false;
  this.compression = options.compression || 'none';
  this.throttle_rate = options.throttle_rate || 0;

  // Check for valid compression types
  if (this.compression && this.compression !== 'png' && this.compression !== 'none') {
    this.emit('warning', this.compression +
      ' compression is not supported. No compression will be used.');
  }

  // Check if throttle rate is negative
  if (this.throttle_rate < 0) {
    this.emit('warning', this.throttle_rate + ' is not allowed. Set to 0');
    this.throttle_rate = 0;
  }
};
ROSLIB.Topic.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Every time a message is published for the given topic, the callback
 * will be called with the message object.
 *
 * @param callback - function with the following params:
 *   * message - the published message
 */
ROSLIB.Topic.prototype.subscribe = function(callback) {
  var that = this;

  this.on('message', function(message) {
    callback(message);
  });

  this.ros.on(this.name, function(data) {
    var message = new ROSLIB.Message(data);
    that.emit('message', message);
  });

  this.ros.idCounter++;
  var subscribeId = 'subscribe:' + this.name + ':' + this.ros.idCounter;
  var call = {
    op : 'subscribe',
    id : subscribeId,
    type : this.messageType,
    topic : this.name,
    compression : this.compression,
    throttle_rate : this.throttle_rate
  };

  this.ros.callOnConnection(call);
};

/**
 * Unregisters as a subscriber for the topic. Unsubscribing will remove
 * all subscribe callbacks.
 */
ROSLIB.Topic.prototype.unsubscribe = function() {
  this.ros.removeAllListeners([ this.name ]);
  this.ros.idCounter++;
  var unsubscribeId = 'unsubscribe:' + this.name + ':' + this.ros.idCounter;
  var call = {
    op : 'unsubscribe',
    id : unsubscribeId,
    topic : this.name
  };
  this.ros.callOnConnection(call);
};

/**
 * Registers as a publisher for the topic.
 */
ROSLIB.Topic.prototype.advertise = function() {
  this.ros.idCounter++;
  var advertiseId = 'advertise:' + this.name + ':' + this.ros.idCounter;
  var call = {
    op : 'advertise',
    id : advertiseId,
    type : this.messageType,
    topic : this.name
  };
  this.ros.callOnConnection(call);
  this.isAdvertised = true;
};

/**
 * Unregisters as a publisher for the topic.
 */
ROSLIB.Topic.prototype.unadvertise = function() {
  this.ros.idCounter++;
  var unadvertiseId = 'unadvertise:' + this.name + ':' + this.ros.idCounter;
  var call = {
    op : 'unadvertise',
    id : unadvertiseId,
    topic : this.name
  };
  this.ros.callOnConnection(call);
  this.isAdvertised = false;
};

/**
 * Publish the message.
 *
 * @param message - A ROSLIB.Message object.
 */
ROSLIB.Topic.prototype.publish = function(message) {
  if (!this.isAdvertised) {
    this.advertise();
  }

  this.ros.idCounter++;
  var publishId = 'publish:' + this.name + ':' + this.ros.idCounter;
  var call = {
    op : 'publish',
    id : publishId,
    topic : this.name,
    msg : message
  };
  this.ros.callOnConnection(call);
};
