/**
 * @author Brandon Alexander - balexander@willowgarage.com
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
  var param = this;
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;

  /**
   * Fetches the value of the param.
   *
   * @param callback - function with the following params:
   *  * value - the value of the param from ROS.
   */
  this.get = function(callback) {
    var paramClient = new ROSLIB.Service({
      ros : param.ros,
      name : '/rosapi/get_param',
      serviceType : 'rosapi/GetParam'
    });

    var request = new ROSLIB.ServiceRequest({
      name : param.name,
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
  this.set = function(value) {
    var paramClient = new ROSLIB.Service({
      ros : param.ros,
      name : '/rosapi/set_param',
      serviceType : 'rosapi/SetParam'
    });

    var request = new ROSLIB.ServiceRequest({
      name : param.name,
      value : JSON.stringify(value)
    });

    paramClient.callService(request, function() {
    });
  };
};
