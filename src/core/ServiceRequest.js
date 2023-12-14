/**
 * @fileOverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

var assign = require('object-assign');

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @template T
*/
class ServiceRequest {
  /**
   * @param {T} [values={}] - Object matching the fields defined in the .srv definition file.
   */
  constructor(values) {
    assign(this, values || {});
  }
}

module.exports = ServiceRequest;
