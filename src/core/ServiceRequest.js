/**
 * @fileOverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

var assign = require('object-assign');

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @param {Object} values - Object matching the fields defined in the .srv definition file.
 */
function ServiceRequest(values) {
  assign(this, values);
}

module.exports = ServiceRequest;