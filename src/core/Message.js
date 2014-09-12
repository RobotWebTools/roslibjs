/**
 * @author Brandon Alexander - baalexander@gmail.com
 */

/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @param values - object matching the fields defined in the .msg definition file
 */
function Message(values) {
  var that = this;
  values = values || {};

  Object.keys(values).forEach(function(name) {
    that[name] = values[name];
  });
}

module.exports = Message;