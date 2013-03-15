/**
 * @author Brandon Alexander - balexander@willowgarage.com
 */

/**
 * A ROS parameter.
 *
 * @constructor
 * @param options - possible keys include:
 *   * name - the param name, like max_vel_x
 */
ROSLIB.Param = function(options) {
  var param = this;
  options = options || {};
  param.name = options.name;

  /**
   * Fetches the value of the param.
   *
   * @param callback - function with the following params:
   *  * value - the value of the param from ROS.
   */
  param.get = function(callback) {
    var paramClient = new ROSLIB.Service({
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
  param.set = function(value) {
    var paramClient = new ROSLIB.Service({
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
ROSLIB.Param.prototype.__proto__ = EventEmitter2.prototype;
