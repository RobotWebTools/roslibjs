/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @param options - possible keys include:
 *   * values - object matching the values of the response part from the .srv file.
 *   * type - the type of service, like 'actionlib_tutorials/FibonacciAction'
 */
ROSLIB.ServiceResponse = function(options) {
  var that = this;
  var options = options || {};
  var values = options.values;
  this.type = options.type;

  if (values) {
    Object.keys(values).forEach(function(name) {
      that[name] = values[name];
    });
  }
};
