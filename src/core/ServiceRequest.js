/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @param options - possible keys include:
 *   * values - object matching the values of the request part from the .srv file.
 */
ROSLIB.ServiceRequest = function(options) {
  var that = this;
  var options = options || {};
  var values = options.values;

  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
