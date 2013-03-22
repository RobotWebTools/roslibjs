/**
 * @author Brandon Alexander - baalexander@gmail.com
 */

/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @param options - possible keys include:
 *   * values - object matching the fields defined in the .msg definition file
 *   * type - the type of message, like 'geometry_msgs/Twist'
 */
ROSLIB.Message = function(options) {
  var that = this;
  var options = options || {};
  var values = options.values;
  this.type = options.type;

  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
