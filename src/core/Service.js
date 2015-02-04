/**
 * @author Brandon Alexander - baalexander@gmail.com
 */

var ServiceResponse = require('./ServiceResponse');

/**
 * A ROS service client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like /add_two_ints
 *   * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
 */
function Service(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.serviceType = options.serviceType;
}

/**
 * Calls the service. Returns the service response in the callback.
 *
 * @param request - the ROSLIB.ServiceRequest to send
 * @param callback - function with params:
 *   * response - the response from the service request
 * @param failedCallback - the callback function when the service call failed (optional). Params:
 *   * error - the error message reported by ROS
 */
Service.prototype.callService = function(request, callback, failedCallback) {
  var serviceCallId = 'call_service:' + this.name + ':' + (++this.ros.idCounter);

  if (callback || failedCallback) {
    this.ros.once(serviceCallId, function(message) {
      if (message.result !== undefined && message.result === false) {
        if (typeof failedCallback === 'function') {
          failedCallback(message.values);
        }
      } else if (typeof callback === 'function') {
        callback(new ServiceResponse(message.values));
      }
    });
  }

  var call = {
    op : 'call_service',
    id : serviceCallId,
    service : this.name,
    args : request
  };
  this.ros.callOnConnection(call);
};

module.exports = Service;