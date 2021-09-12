/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import assign from 'object-assign';

/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @param values - object matching the fields defined in the .msg definition file
 */
export function Message(values) {
  assign(this, values);
}
