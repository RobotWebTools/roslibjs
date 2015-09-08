/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var assign = require('object-assign');

/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @param values - object matching the fields defined in the .msg definition file
 */
function Message(values) {
  assign(this, values);
}

module.exports = Message;