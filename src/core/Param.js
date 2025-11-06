/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import Service from "./Service.js";

/**
 * A ROS parameter.
 */
export default class Param {
  ros;
  name;
  /**
   * @param {Object} options
   * @param {import('../core/Ros.js').default} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} options.name - The param name, like max_vel_x.
   */
  constructor({ ros, name }) {
    this.ros = ros;
    this.name = name;
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
   * @param {getFailedCallback} [failedCallback] - The callback function when the service call failed or the parameter retrieval was unsuccessful.
   */
  get(callback, failedCallback) {
    const paramClient = new Service({
      ros: this.ros,
      name: "rosapi/get_param",
      serviceType: "rosapi/GetParam",
    });

    const request = { name: this.name };

    paramClient.callService(
      request,
      function (result) {
        if (result.successful === false && failedCallback) {
          failedCallback(result.reason);
        } else {
          const value = JSON.parse(result.value);
          callback(value);
        }
      },
      failedCallback,
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
    const paramClient = new Service({
      ros: this.ros,
      name: "rosapi/set_param",
      serviceType: "rosapi/SetParam",
    });

    const request = {
      name: this.name,
      value: JSON.stringify(value),
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
      failedCallback,
    );
  }
  /**
   * Delete this parameter on the ROS server.
   *
   * @param {setParamCallback} callback - The callback function.
   * @param {setParamFailedCallback} [failedCallback] - The callback function when the service call failed or the parameter deletion was unsuccessful.
   */
  delete(callback, failedCallback) {
    const paramClient = new Service({
      ros: this.ros,
      name: "rosapi/delete_param",
      serviceType: "rosapi/DeleteParam",
    });

    const request = {
      name: this.name,
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
      failedCallback,
    );
  }
}
