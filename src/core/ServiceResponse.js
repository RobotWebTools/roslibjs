/**
 * @fileOverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

var assign = require('object-assign');

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @template T
*/
class ServiceResponse {
  /**
   * @param {T} values - Object matching the fields defined in the .srv definition file.
   */
  constructor(values) {
    assign(this, values);
  }
}

module.exports = ServiceResponse;
