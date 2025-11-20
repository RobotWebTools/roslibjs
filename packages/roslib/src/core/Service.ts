/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import { EventEmitter } from "eventemitter3";
import type { RosbridgeMessage } from "../types/protocol.ts";
import {
  isRosbridgeCallServiceMessage,
  isRosbridgeServiceResponseMessage,
} from "../types/protocol.ts";
import type Ros from "./Ros.ts";
import { v4 as uuidv4 } from "uuid";

/**
 * A ROS service client.
 */
export default class Service<TRequest, TResponse> extends EventEmitter {
  /**
   * Stores a reference to the most recent service callback advertised so it can be removed from the EventEmitter during un-advertisement
   */
  #serviceCallback: ((rosbridgeRequest: RosbridgeMessage) => void) | null =
    null;
  isAdvertised = false;
  /**
   * Queue for serializing advertise/unadvertise operations to prevent race conditions
   */
  #operationQueue = Promise.resolve();
  /**
   * Track if an unadvertise operation is pending to prevent double operations
   */
  #pendingUnadvertise = false;
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
    failedCallback: (error: string) => void = console.error,
    timeout?: number,
  ): void {
    if (this.isAdvertised) {
      return;
    }

    const serviceCallId = `call_service:${this.name}:${uuidv4()}`;

    this.ros.once(serviceCallId, function (message) {
      if (isRosbridgeServiceResponseMessage<TResponse>(message)) {
        if (!message.result) {
          failedCallback(message.values ?? "");
        } else {
          callback?.(message.values);
        }
      }
    });

    this.ros.callOnConnection({
      op: "call_service",
      id: serviceCallId,
      service: this.name,
      args: request,
      timeout: timeout,
    });
  }
  /**
   * Advertise the service. This turns the Service object from a client
   * into a server. The callback will be called with every request
   * that's made on this service.
   *
   * @param callback This works similarly to the callback for a C++ service in that you should take care not to overwrite the response object.
   *  Instead, only modify the values within.
   */
  async advertise(
    callback: (request: TRequest, response: Partial<TResponse>) => boolean,
  ): Promise<void> {
    // Queue this operation to prevent race conditions
    this.#operationQueue = this.#operationQueue
      .then(() => {
        // If already advertised, unadvertise first
        if (this.isAdvertised) {
          this.#doUnadvertise();
        }

        // Store the new callback for removal during un-advertisement
        this.#serviceCallback = (rosbridgeRequest) => {
          if (!isRosbridgeCallServiceMessage<TRequest>(rosbridgeRequest)) {
            throw new Error(
              `Invalid message received on service channel: ${JSON.stringify(rosbridgeRequest)}`,
            );
          }
          // @ts-expect-error -- TypeScript doesn't have a way to handle the out-parameter model used here.
          const response: TResponse = {};
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
            });
          } else {
            this.ros.callOnConnection({
              op: "service_response",
              service: this.name,
              result: success,
              id: rosbridgeRequest.id,
            });
          }
        };

        this.ros.on(this.name, this.#serviceCallback);
        this.ros.callOnConnection({
          op: "advertise_service",
          type: this.serviceType,
          service: this.name,
        });
        this.isAdvertised = true;
      })
      .catch((err: unknown) => {
        this.emit("error", err);
        throw err;
      });

    return this.#operationQueue;
  }

  /**
   * Internal method to perform unadvertisement without queueing
   */
  #doUnadvertise() {
    if (!this.isAdvertised || this.#pendingUnadvertise) {
      return;
    }

    this.#pendingUnadvertise = true;

    try {
      /*
       * Mark as not advertised first to prevent new service calls
       * This ensures callService() will not be blocked while we're unadvertising
       */
      this.isAdvertised = false;

      // Remove the registered callback to stop processing new requests
      if (this.#serviceCallback) {
        this.ros.off(this.name, this.#serviceCallback);
        this.#serviceCallback = null;
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
      this.#pendingUnadvertise = false;
    }
  }

  async unadvertise(): Promise<void> {
    // Queue this operation to prevent race conditions
    this.#operationQueue = this.#operationQueue
      .then(() => {
        this.#doUnadvertise();
      })
      .catch((err: unknown) => {
        this.emit("error", err);
        throw err;
      });

    return this.#operationQueue;
  }

  /**
   * An alternate form of Service advertisement that supports a modern Promise-based interface for use with async/await.
   * @param callback An asynchronous callback processing the request and returning a response.
   */
  async advertiseAsync(
    callback: (request: TRequest) => Promise<TResponse>,
  ): Promise<void> {
    // Queue this operation to prevent race conditions
    this.#operationQueue = this.#operationQueue
      .then(() => {
        // If already advertised, unadvertise first
        if (this.isAdvertised) {
          this.#doUnadvertise();
        }

        this.#serviceCallback = (rosbridgeRequest) => {
          if (!isRosbridgeCallServiceMessage<TRequest>(rosbridgeRequest)) {
            throw new Error(
              `Invalid message received on service channel: ${JSON.stringify(rosbridgeRequest)}`,
            );
          }
          (async () => {
            try {
              this.ros.callOnConnection({
                op: "service_response",
                service: this.name,
                result: true,
                values: await callback(rosbridgeRequest.args),
                id: rosbridgeRequest.id,
              });
            } catch (err) {
              this.ros.callOnConnection({
                op: "service_response",
                service: this.name,
                result: false,
                values: String(err),
                id: rosbridgeRequest.id,
              });
            }
          })().catch(console.error);
        };
        this.ros.on(this.name, this.#serviceCallback);
        this.ros.callOnConnection({
          op: "advertise_service",
          type: this.serviceType,
          service: this.name,
        });
        this.isAdvertised = true;
      })
      .catch((err: unknown) => {
        this.emit("error", err);
        throw err;
      });

    return this.#operationQueue;
  }
}
