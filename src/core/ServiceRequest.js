/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @param values - object matching the values of the request part from the .srv file.
 */
ROSLIB.ServiceRequest = function(values) {
  var that = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
