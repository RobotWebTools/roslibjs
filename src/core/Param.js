/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var Service = require('./Service');
var Ros = require('../core/Ros');

/**
 * A ROS parameter.
 */
class Param {
  /**
   * @param {Object} options
   * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} options.name - The param name, like max_vel_x.
   */
  constructor(options) {
    this.ros = options.ros;
    this.name = options.name;
  }
  /**
   * @callback getCallback
   * @param {Object} value - The value of the param from ROS.
   */
  /**
   * @callback getFailedCallback
   * @param {string} error - The error message reported by ROS.
   */
  /**
   * Fetch the value of the param.
   *
   * @param {getCallback} callback - The callback function.
   * @param {getFailedCallback} [failedCallback] - The callback function when the service call failed.
   */
  get(callback, failedCallback) {
    var paramClient = new Service({
      ros: this.ros,
      name: '/rosapi/get_param',
      serviceType: 'rosapi/GetParam'
    });

    var request = {name: this.name};

    paramClient.callService(
      request,
      function (result) {
        var value = JSON.parse(result.value);
        callback(value);
      },
      failedCallback
    );
  }
  /**
   * @callback setParamCallback
   * @param {Object} response - The response from the service request.
   */
  /**
   * @callback setParamFailedCallback
   * @param {string} error - The error message reported by ROS.
   */
  /**
   * Set the value of the param in ROS.
   *
   * @param {Object} value - The value to set param to.
   * @param {setParamCallback} [callback] - The callback function.
   * @param {setParamFailedCallback} [failedCallback] - The callback function when the service call failed.
   */
  set(value, callback, failedCallback) {
    var paramClient = new Service({
      ros: this.ros,
      name: '/rosapi/set_param',
      serviceType: 'rosapi/SetParam'
    });

    var request = {
      name: this.name,
      value: JSON.stringify(value)
    };

    paramClient.callService(request, callback, failedCallback);
  }
  /**
   * Delete this parameter on the ROS server.
   *
   * @param {setParamCallback} callback - The callback function.
   * @param {setParamFailedCallback} [failedCallback] - The callback function when the service call failed.
   */
  delete(callback, failedCallback) {
    var paramClient = new Service({
      ros: this.ros,
      name: '/rosapi/delete_param',
      serviceType: 'rosapi/DeleteParam'
    });

    var request = {name: this.name};

    paramClient.callService(request, callback, failedCallback);
  }
}

module.exports = Param;
