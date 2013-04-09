/**
 * @author Brandon Alexander - baalexander@gmail.com
 */

/**
 * A ROS service client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like /add_two_ints
 *   * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
 */
ROSLIB.Service = function(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.serviceType = options.serviceType;
};

/**
 * Calls the service. Returns the service response in the callback.
 *
 * @param request - the ROSLIB.ServiceRequest to send
 * @param callback - function with params:
 *   * response - the response from the service request
 */
ROSLIB.Service.prototype.callService = function(request, callback) {
  this.ros.idCounter++;
  var serviceCallId = 'call_service:' + this.name + ':' + this.ros.idCounter;

  this.ros.once(serviceCallId, function(data) {
    var response = new ROSLIB.ServiceResponse(data);
    callback(response);
  });

  var requestValues = [];
  Object.keys(request).forEach(function(name) {
    requestValues.push(request[name]);
  });

  var call = {
    op : 'call_service',
    id : serviceCallId,
    service : this.name,
    args : requestValues
  };
  this.ros.callOnConnection(call);
};
