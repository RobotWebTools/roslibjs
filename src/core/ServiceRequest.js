/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @param values - object matching the fields defined in the .srv definition file
 */
ROSLIB.ServiceRequest = function(values) {
  var that = this;
  values = values || {};

  Object.keys(values).forEach(function(name) {
    that[name] = values[name];
  });
};
