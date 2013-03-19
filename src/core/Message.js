/**
 * @author Brandon Alexander - baalexander@gmail.com
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
