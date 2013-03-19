/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @param values - object matching the values of the response part from the .srv file.
 */
ROSLIB.ServiceResponse = function(values) {
  var that = this;
  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
