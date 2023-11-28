/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var Service = require('./Service');
var ServiceRequest = require('./ServiceRequest');

/**
 * A ROS parameter.
 *
 * @constructor
 * @param {Object} options
 * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
 * @param {string} options.name - The param name, like max_vel_x.
 */
function Param(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
}

/**
 * Fetch the value of the param.
 *
 * @param {function} callback - Function with the following params:
 * @param {Object} callback.value - The value of the param from ROS.
 * @param {function} [failedCallback] - Function when the service call failed with the following params:
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Param.prototype.get = function(callback, failedCallback) {
  var paramClient = new Service({
    ros : this.ros,
    name : '/rosapi/get_param',
    serviceType : 'rosapi/GetParam'
  });

  var request = new ServiceRequest({
    name : this.name
  });

  paramClient.callService(request, function(result) {
    var value = JSON.parse(result.value);
    callback(value);
  }, failedCallback);
};

/**
 * Set the value of the param in ROS.
 *
 * @param {Object} value - The value to set param to.
 * @param {function} [callback] - The callback function.
 * @param {function} [failedCallback] - The callback function when the service call failed.
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Param.prototype.set = function(value, callback, failedCallback) {
  var paramClient = new Service({
    ros : this.ros,
    name : '/rosapi/set_param',
    serviceType : 'rosapi/SetParam'
  });

  var request = new ServiceRequest({
    name : this.name,
    value : JSON.stringify(value)
  });

  paramClient.callService(request, callback, failedCallback);
};

/**
 * Delete this parameter on the ROS server.
 *
 * @param {function} [callback] - The callback function when the service call succeeded.
 * @param {function} [failedCallback] - The callback function when the service call failed.
 * @param {string} failedCallback.error - The error message reported by ROS.
 */
Param.prototype.delete = function(callback, failedCallback) {
  var paramClient = new Service({
    ros : this.ros,
    name : '/rosapi/delete_param',
    serviceType : 'rosapi/DeleteParam'
  });

  var request = new ServiceRequest({
    name : this.name
  });

  paramClient.callService(request, callback, failedCallback);
};

module.exports = Param;
