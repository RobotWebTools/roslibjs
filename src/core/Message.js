/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import assign from 'object-assign';

/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @template T
*/
export default class Message {
  /**
   * @param {T} [values={}] - An object matching the fields defined in the .msg definition file.
   */
  constructor(values) {
    assign(this, values || {});
  }
}
