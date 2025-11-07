/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import { EventEmitter } from "eventemitter3";
import {
  RosbridgeCallServiceMessage,
  RosbridgeServiceResponseMessage,
} from "../types/protocol.ts";
import Ros from "./Ros.js";

/**
 * A ROS service client.
 */
export default class Service<TRequest, TResponse> extends EventEmitter {
  /**
   * Stores a reference to the most recent service callback advertised so it can be removed from the EventEmitter during un-advertisement
   * @private
   */
  _serviceCallback:
    | ((rosbridgeRequest: RosbridgeCallServiceMessage<TRequest>) => void)
    | null = null;
  isAdvertised = false;
  /**
   * Queue for serializing advertise/unadvertise operations to prevent race conditions
   * @private
   */
  _operationQueue = Promise.resolve();
  /**
   * Track if an unadvertise operation is pending to prevent double operations
   * @private
   */
  _pendingUnadvertise = false;
  ros: Ros;
  name: string;
  serviceType: string;
  /**
   * @param options
   * @param options.ros - The ROSLIB.Ros connection handle.
   * @param options.name - The service name, like '/add_two_ints'.
   * @param options.serviceType - The service type, like 'rospy_tutorials/AddTwoInts'.
   */
  constructor({
    ros,
    name,
    serviceType,
  }: {
    ros: Ros;
    name: string;
    serviceType: string;
  }) {
    super();
    this.ros = ros;
    this.name = name;
    this.serviceType = serviceType;
  }
  /**
   * Call the service. Returns the service response in the
   * callback. Does nothing if this service is currently advertised.
   *
   * @param request - The service request to send.
   * @param [callback] - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   * @param [timeout] - Optional timeout, in seconds, for the service call. A non-positive value means no timeout.
   *                             If not provided, the rosbridge server will use its default value.
   */
  callService(
    request: TRequest,
    callback?: (response: TResponse) => void,
    failedCallback?: (error: string) => void,
    timeout?: number,
  ) {
    if (this.isAdvertised) {
      return;
    }

    const serviceCallId =
      "call_service:" + this.name + ":" + (++this.ros.idCounter).toString();

    if (callback || failedCallback) {
      this.ros.once(serviceCallId, function (message) {
        if (message.result !== undefined && message.result === false) {
          if (typeof failedCallback === "function") {
            failedCallback(message.values);
          }
        } else if (typeof callback === "function") {
          callback(message.values);
        }
      });
    }

    const call = {
      op: "call_service",
      id: serviceCallId,
      service: this.name,
      type: this.serviceType,
      args: request,
      timeout: timeout,
    };

    this.ros.callOnConnection(call);
  }
  /**
   * Advertise the service. This turns the Service object from a client
   * into a server. The callback will be called with every request
   * that's made on this service.
   *
   * @param callback This works similarly to the callback for a C++ service in that you should take care not to overwrite the response object.
   *  Instead, only modify the values within.
   */
  advertise(
    callback: (request: TRequest, response: Partial<TResponse>) => boolean,
  ) {
    // Queue this operation to prevent race conditions
    this._operationQueue = this._operationQueue
      .then(async () => {
        // If already advertised, unadvertise first
        if (this.isAdvertised) {
          await this._doUnadvertise();
        }

        // Store the new callback for removal during un-advertisement
        this._serviceCallback = (rosbridgeRequest) => {
          const response = {};
          let success: boolean;
          try {
            success = callback(rosbridgeRequest.args, response);
          } catch {
            success = false;
          }

          if (success) {
            this.ros.callOnConnection({
              op: "service_response",
              service: this.name,
              values: response,
              result: success,
              id: rosbridgeRequest.id,
            } satisfies RosbridgeServiceResponseMessage<Partial<TResponse>>);
          } else {
            this.ros.callOnConnection({
              op: "service_response",
              service: this.name,
              result: success,
              id: rosbridgeRequest.id,
            } satisfies RosbridgeServiceResponseMessage<Partial<TResponse>>);
          }
        };

        this.ros.on(this.name, this._serviceCallback);
        this.ros.callOnConnection({
          op: "advertise_service",
          type: this.serviceType,
          service: this.name,
        });
        this.isAdvertised = true;
      })
      .catch((err) => {
        this.emit("error", err);
        throw err;
      });

    return this._operationQueue;
  }

  /**
   * Internal method to perform unadvertisement without queueing
   * @private
   */
  async _doUnadvertise() {
    if (!this.isAdvertised || this._pendingUnadvertise) {
      return;
    }

    this._pendingUnadvertise = true;

    try {
      /*
       * Mark as not advertised first to prevent new service calls
       * This ensures callService() will not be blocked while we're unadvertising
       */
      this.isAdvertised = false;

      // Remove the registered callback to stop processing new requests
      if (this._serviceCallback) {
        this.ros.off(this.name, this._serviceCallback);
        this._serviceCallback = null;
      }

      /*
       * Send the unadvertise message to the server
       * Note: This is fire-and-forget, but the operation queue ensures
       * no new advertise can start until this completes
       */
      this.ros.callOnConnection({
        op: "unadvertise_service",
        service: this.name,
      });
    } finally {
      this._pendingUnadvertise = false;
    }
  }

  unadvertise() {
    // Queue this operation to prevent race conditions
    this._operationQueue = this._operationQueue
      .then(async () => {
        await this._doUnadvertise();
      })
      .catch((err) => {
        this.emit("error", err);
        throw err;
      });

    return this._operationQueue;
  }

  /**
   * An alternate form of Service advertisement that supports a modern Promise-based interface for use with async/await.
   * @param callback An asynchronous callback processing the request and returning a response.
   */
  advertiseAsync(callback: (request: TRequest) => Promise<TResponse>) {
    // Queue this operation to prevent race conditions
    this._operationQueue = this._operationQueue
      .then(async () => {
        // If already advertised, unadvertise first
        if (this.isAdvertised) {
          await this._doUnadvertise();
        }

        this._serviceCallback = async (rosbridgeRequest) => {
          try {
            this.ros.callOnConnection({
              op: "service_response",
              service: this.name,
              result: true,
              values: await callback(rosbridgeRequest.args),
              id: rosbridgeRequest.id,
            } satisfies RosbridgeServiceResponseMessage<TResponse>);
          } catch (err) {
            this.ros.callOnConnection({
              op: "service_response",
              service: this.name,
              result: false,
              values: String(err),
              id: rosbridgeRequest.id,
            } satisfies RosbridgeServiceResponseMessage<TResponse>);
          }
        };
        this.ros.on(this.name, this._serviceCallback);
        this.ros.callOnConnection({
          op: "advertise_service",
          type: this.serviceType,
          service: this.name,
        });
        this.isAdvertised = true;
      })
      .catch((err) => {
        this.emit("error", err);
        throw err;
      });

    return this._operationQueue;
  }
}
