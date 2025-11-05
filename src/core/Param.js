/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import Service from './Service.js';
import Ros from '../core/Ros.js';

/**
 * A ROS parameter.
 */
export default class Param {
  /**
   * @param {Object} options
   * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} options.name - The param name, like max_vel_x.
   * @param {'int' | 'double'} [options.numberTypeHint] - The type hint for numbers. Defaults to 'int'.
   */
  constructor(options) {
    this.ros = options.ros;
    this.name = options.name;
    this.numberTypeHint = options.numberTypeHint ?? 'int';
  }

  /**
   * Function to replace or transform values during JSON stringification.
   *
   * Stringification of a whole double value will result in a string without a decimal point.
   * (e.g. 1.0 will be stringified as "1"). This causes conflict with ROS2 parameters, which incorrectly parse the incoming value as an integer.
   * If dynamic typing is not enabled, this will cause the parameter set operation to fail.
   *
   * @param {string} _key - The key of the property being replaced (not used in the logic but needed for a replacer).
   * @param {unknown} value - The value to be inspected or transformed.
   * @returns {unknown} - The original value or a transformed representation of the value.
   */
  replacer = (_key, value) => {
    if (typeof value === 'number' && this.numberTypeHint === 'double') {
      let numberStr = String(value);
      if (!numberStr.includes('.')) {
        numberStr += '.0';
      }
      return numberStr;
    }
    return value;
  };

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
   * @param {getFailedCallback} [failedCallback] - The callback function when the service call failed or the parameter retrieval was unsuccessful.
   */
  get(callback, failedCallback) {
    var paramClient = new Service({
      ros: this.ros,
      name: 'rosapi/get_param',
      serviceType: 'rosapi/GetParam'
    });

    var request = { name: this.name };

    paramClient.callService(
      request,
      function (result) {
        if (result.successful === false && failedCallback) {
          failedCallback(result.reason);
        } else {
          var value = JSON.parse(result.value);
          callback(value);
        }
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
   * @param {setParamFailedCallback} [failedCallback] - The callback function when the service call failed or the parameter setting was unsuccessful.
   */
  set(value, callback, failedCallback) {
    var paramClient = new Service({
      ros: this.ros,
      name: 'rosapi/set_param',
      serviceType: 'rosapi/SetParam'
    });

    var request = {
      name: this.name,
      value: JSON.stringify(value, this.replacer)
    };

    paramClient.callService(
      request,
      function (result) {
        if (result.successful === false && failedCallback) {
          failedCallback(result.reason);
        } else if (callback) {
          callback(result);
        }
      },
      failedCallback
    );
  }
  /**
   * Delete this parameter on the ROS server.
   *
   * @param {setParamCallback} callback - The callback function.
   * @param {setParamFailedCallback} [failedCallback] - The callback function when the service call failed or the parameter deletion was unsuccessful.
   */
  delete(callback, failedCallback) {
    var paramClient = new Service({
      ros: this.ros,
      name: 'rosapi/delete_param',
      serviceType: 'rosapi/DeleteParam'
    });

    var request = {
      name: this.name
    };

    paramClient.callService(
      request,
      function (result) {
        if (result.successful === false && failedCallback) {
          failedCallback(result.reason);
        } else if (callback) {
          callback(result);
        }
      },
      failedCallback
    );
  }
}
