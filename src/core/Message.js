/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var assign = require('object-assign');

/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @template T
*/
class Message {
  /**
   * @param {T} [values={}] - An object matching the fields defined in the .msg definition file.
   */
  constructor(values) {
    assign(this, values || {});
  }
}

module.exports = Message;
