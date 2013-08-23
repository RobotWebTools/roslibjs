/**
 * @author Brandon Alexander - baalexander@gmail.com
 */

/**
 * A ROS parameter.
 *
 * @constructor
 * @param options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the param name, like max_vel_x
 */
ROSLIB.Param = function(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
};

/**
 * Fetches the value of the param.
 *
 * @param callback - function with the following params:
 *  * value - the value of the param from ROS.
 */
ROSLIB.Param.prototype.get = function(callback) {
  var paramClient = new ROSLIB.Service({
    ros : this.ros,
    name : '/rosapi/get_param',
    serviceType : 'rosapi/GetParam'
  });

  var request = new ROSLIB.ServiceRequest({
    name : this.name,
    value : JSON.stringify('')
  });

  paramClient.callService(request, function(result) {
    var value = JSON.parse(result.value);
    callback(value);
  });
};

/**
 * Sets the value of the param in ROS.
 *
 * @param value - value to set param to.
 */
ROSLIB.Param.prototype.set = function(value) {
  var paramClient = new ROSLIB.Service({
    ros : this.ros,
    name : '/rosapi/set_param',
    serviceType : 'rosapi/SetParam'
  });

  var request = new ROSLIB.ServiceRequest({
    name : this.name,
    value : JSON.stringify(value)
  });

  paramClient.callService(request, function() {
  });
};

/**
 * Delete this parameter on the ROS server.
 */
ROSLIB.Param.prototype.delete = function() {
  var paramClient = new ROSLIB.Service({
    ros : this.ros,
    name : '/rosapi/delete_param',
    serviceType : 'rosapi/DeleteParam'
  });

  var request = new ROSLIB.ServiceRequest({
    name : this.name
  });

  paramClient.callService(request, function() {
  });
};
