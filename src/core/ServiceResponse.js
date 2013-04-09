/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @param values - object matching the fields defined in the .srv definition file
 */
ROSLIB.ServiceResponse = function(values) {
  var that = this;
  values = values || {};

  Object.keys(values).forEach(function(name) {
    that[name] = values[name];
  });
};
