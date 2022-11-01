/**
 * @fileOverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

var assign = require('object-assign');

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @param {Object} values - Object matching the fields defined in the .srv definition file.
 */
function ServiceResponse(values) {
  assign(this, values);
}

module.exports = ServiceResponse;