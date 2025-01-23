/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import Ros from './Ros.js';
import { EventEmitter } from 'eventemitter3';

/**
 * A ROS service client.
 * @template TRequest, TResponse
 */
export default class Service extends EventEmitter {
  /**
     * Stores a reference to the most recent service callback advertised so it can be removed from the EventEmitter during un-advertisement
     * @private
     * @type {((rosbridgeRequest) => any) | null}
     */
  _serviceCallback = null;
  isAdvertised = false;
  /**
   * @param {Object} options
   * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} options.name - The service name, like '/add_two_ints'.
   * @param {string} options.serviceType - The service type, like 'rospy_tutorials/AddTwoInts'.
   */
  constructor(options) {
    super();
    this.ros = options.ros;
    this.name = options.name;
    this.serviceType = options.serviceType;
  }
  /**
   * @callback callServiceCallback
   *  @param {TResponse} response - The response from the service request.
   */
  /**
   * @callback callServiceFailedCallback
   * @param {string} error - The error message reported by ROS.
   */
  /**
   * Call the service. Returns the service response in the
   * callback. Does nothing if this service is currently advertised.
   *
   * @param {TRequest} request - The service request to send.
   * @param {callServiceCallback} [callback] - Function with the following params:
   * @param {callServiceFailedCallback} [failedCallback] - The callback function when the service call failed with params:
   * @param {number} [timeout] - Optional timeout, in seconds, for the service call. A non-positive value means no timeout.
   *                             If not provided, the rosbridge server will use its default value.
  */
  callService(request, callback, failedCallback, timeout) {
    if (this.isAdvertised) {
      return;
    }

    var serviceCallId =
      'call_service:' + this.name + ':' + (++this.ros.idCounter).toString();

    if (callback || failedCallback) {
      this.ros.once(serviceCallId, function (message) {
        if (message.result !== undefined && message.result === false) {
          if (typeof failedCallback === 'function') {
            failedCallback(message.values);
          }
        } else if (typeof callback === 'function') {
          callback(message.values);
        }
      });
    }

    var call = {
      op: 'call_service',
      id: serviceCallId,
      service: this.name,
      type: this.serviceType,
      args: request,
      timeout: timeout
    };

    this.ros.callOnConnection(call);
  }
  /**
   * @callback advertiseCallback
   * @param {TRequest} request - The service request.
   * @param {Partial<TResponse>} response - An empty dictionary. Take care not to overwrite this. Instead, only modify the values within.
   * @returns {boolean} true if the service has finished successfully, i.e., without any fatal errors.
   */
  /**
   * Advertise the service. This turns the Service object from a client
   * into a server. The callback will be called with every request
   * that's made on this service.
   *
   * @param {advertiseCallback} callback - This works similarly to the callback for a C++ service and should take the following params
   */
  advertise(callback) {
    if (this.isAdvertised) {
      throw new Error('Cannot advertise the same Service twice!');
    }

    // Store the new callback for removal during un-advertisement
    this._serviceCallback = (rosbridgeRequest) => {
      var response = {};
      var success = callback(rosbridgeRequest.args, response);

      var call = {
        op: 'service_response',
        service: this.name,
        values: response,
        result: success
      };

      if (rosbridgeRequest.id) {
        call.id = rosbridgeRequest.id;
      }

      this.ros.callOnConnection(call);
    };

    this.ros.on(this.name, this._serviceCallback);
    this.ros.callOnConnection({
      op: 'advertise_service',
      type: this.serviceType,
      service: this.name
    });
    this.isAdvertised = true;
  }

  unadvertise() {
    if (!this.isAdvertised) {
      throw new Error(`Tried to un-advertise service ${this.name}, but it was not advertised!`);
    }
    this.ros.callOnConnection({
      op: 'unadvertise_service',
      service: this.name
    });
    // Remove the registered callback
    if (this._serviceCallback) {
      this.ros.off(this.name, this._serviceCallback);
    }
    this.isAdvertised = false;
  }

  /**
   * An alternate form of Service advertisement that supports a modern Promise-based interface for use with async/await.
   * @param {(request: TRequest) => Promise<TResponse>} callback An asynchronous callback processing the request and returning a response.
   */
  advertiseAsync(callback) {
    if (this.isAdvertised) {
      throw new Error('Cannot advertise the same Service twice!');
    }
    this._serviceCallback = async (rosbridgeRequest) => {
      /** @type {{op: string, service: string, values?: TResponse, result: boolean, id?: string}} */
      let rosbridgeResponse = {
        op: 'service_response',
        service: this.name,
        result: false
      }
      try {
        rosbridgeResponse.values = await callback(rosbridgeRequest.args);
        rosbridgeResponse.result = true;
      } finally {
        if (rosbridgeRequest.id) {
          rosbridgeResponse.id = rosbridgeRequest.id;
        }
        this.ros.callOnConnection(rosbridgeResponse);
      }
    }
    this.ros.on(this.name, this._serviceCallback);
    this.ros.callOnConnection({
      op: 'advertise_service',
      type: this.serviceType,
      service: this.name
    });
    this.isAdvertised = true;
  }
}
