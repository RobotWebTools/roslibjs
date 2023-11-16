/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var Service = require('./Service');
var ServiceRequest = require('./ServiceRequest');
var Ros = require("../core/Ros");

/**
 * A ROS parameter.
 *
 * @constructor
 * @param {Object} options
 * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
 * @param {string} options.name - The param name, like max_vel_x.
 */
class Param {
  constructor(options) {
    options = options || {};
    this.ros = options.ros;
    this.name = options.name;
  }
  /**
   * Fetch the value of the param.
   *
   * @param {function} callback - Function with the following params:
   * @param {Object} callback.value - The value of the param from ROS.
   */
  get(callback) {
    var paramClient = new Service({
      ros: this.ros,
      name: "/rosapi/get_param",
      serviceType: "rosapi/GetParam",
    });

    var request = new ServiceRequest({
      name: this.name,
    });

    paramClient.callService(request, function (result) {
      var value = JSON.parse(result.value);
      callback(value);
    });
  }
  /**
   * Set the value of the param in ROS.
   *
   * @param {Object} value - The value to set param to.
   * @param {function} callback - The callback function.
   */
  set(value, callback) {
    var paramClient = new Service({
      ros: this.ros,
      name: "/rosapi/set_param",
      serviceType: "rosapi/SetParam",
    });

    var request = new ServiceRequest({
      name: this.name,
      value: JSON.stringify(value),
    });

    paramClient.callService(request, callback);
  }
  /**
   * Delete this parameter on the ROS server.
   *
   * @param {function} callback - The callback function.
   */
  delete(callback) {
    var paramClient = new Service({
      ros: this.ros,
      name: "/rosapi/delete_param",
      serviceType: "rosapi/DeleteParam",
    });

    var request = new ServiceRequest({
      name: this.name,
    });

    paramClient.callService(request, callback);
  }
}




module.exports = Param;
