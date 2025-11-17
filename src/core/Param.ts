/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import type { rosapi } from "../types/rosapi.ts";
import type Ros from "./Ros.ts";
import Service from "./Service.ts";

/**
 * A ROS parameter.
 */
export default class Param<T = unknown> {
  ros: Ros;
  name: string;
  /**
   * @param options
   * @param options.ros - The ROSLIB.Ros connection handle.
   * @param options.name - The param name, like max_vel_x.
   */
  constructor({ ros, name }: { ros: Ros; name: string }) {
    this.ros = ros;
    this.name = name;
  }
  /**
   * Fetch the value of the param.
   *
   * @param callback - The callback function.
   * @param [failedCallback] - The callback function when the service call failed or the parameter retrieval was unsuccessful.
   */
  get(
    callback: (value: T) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const paramClient = new Service<
      rosapi.GetParamRequest,
      rosapi.GetParamResponse
    >({
      ros: this.ros,
      name: "rosapi/get_param",
      serviceType: "rosapi/GetParam",
    });

    const request = { name: this.name };

    paramClient.callService(
      request,
      function (result) {
        if ("successful" in result && !result.successful) {
          failedCallback(result.reason);
        } else {
          callback(JSON.parse(result.value) as T);
        }
      },
      failedCallback,
    );
  }
  /**
   * Set the value of the param in ROS.
   *
   * @param value - The value to set param to.
   * @param [callback] - The callback function.
   * @param [failedCallback] - The callback function when the service call failed or the parameter setting was unsuccessful.
   */
  set(
    value: T,
    callback?: (message: rosapi.SetParamResponse) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const paramClient = new Service<
      rosapi.SetParamRequest,
      rosapi.SetParamResponse
    >({
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
        if ("successful" in result && !result.successful) {
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
   * @param callback - The callback function.
   * @param [failedCallback] - The callback function when the service call failed or the parameter deletion was unsuccessful.
   */
  delete(
    callback: (message: rosapi.DeleteParamResponse) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const paramClient = new Service<
      rosapi.DeleteParamRequest,
      rosapi.DeleteParamResponse
    >({
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
        if ("successful" in result && !result.successful) {
          failedCallback(result.reason);
        } else {
          callback(result);
        }
      },
      failedCallback,
    );
  }
}
