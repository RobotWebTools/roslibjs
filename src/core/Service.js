/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var ServiceResponse = require('./ServiceResponse');
var ServiceRequest = require('./ServiceRequest');
var EventEmitter = require('eventemitter3').EventEmitter;
var Ros = require('../core/Ros');

/**
 * A ROS service client.
 * @template TRequest, TResponse
 */
class Service extends EventEmitter {
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
    this.isAdvertised = false;

    this._serviceCallback = null;
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
   * @param {TRequest} request - The ROSLIB.ServiceRequest to send.
   * @param {callServiceCallback} [callback] - Function with the following params:
   * @param {callServiceFailedCallback} [failedCallback] - The callback function when the service call failed with params:
   */
  callService(request, callback, failedCallback) {
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
          // @ts-expect-error -- can't figure out how to get ServiceResponse to play nice in typescript here
          callback(new ServiceResponse(message.values));
        }
      });
    }

    var call = {
      op: 'call_service',
      id: serviceCallId,
      service: this.name,
      type: this.serviceType,
      args: request
    };
    this.ros.callOnConnection(call);
  }
  /**
   * @callback advertiseCallback
   * @param {ServiceRequest<TRequest>} request - The service request.
   * @param {Object} response - An empty dictionary. Take care not to overwrite this. Instead, only modify the values within.
   *     It should return true if the service has finished successfully,
   *     i.e., without any fatal errors.
   */
  /**
   * Advertise the service. This turns the Service object from a client
   * into a server. The callback will be called with every request
   * that's made on this service.
   *
   * @param {advertiseCallback} callback - This works similarly to the callback for a C++ service and should take the following params
   */
  advertise(callback) {
    if (this.isAdvertised || typeof callback !== 'function') {
      return;
    }

    this._serviceCallback = callback;
    this.ros.on(this.name, this._serviceResponse.bind(this));
    this.ros.callOnConnection({
      op: 'advertise_service',
      type: this.serviceType,
      service: this.name
    });
    this.isAdvertised = true;
  }
  unadvertise() {
    if (!this.isAdvertised) {
      return;
    }
    this.ros.callOnConnection({
      op: 'unadvertise_service',
      service: this.name
    });
    this.isAdvertised = false;
  }
  _serviceResponse(rosbridgeRequest) {
    var response = {};
    // @ts-expect-error -- possibly null
    var success = this._serviceCallback(rosbridgeRequest.args, response);

    var call = {
      op: 'service_response',
      service: this.name,
      values: new ServiceResponse(response),
      result: success
    };

    if (rosbridgeRequest.id) {
      call.id = rosbridgeRequest.id;
    }

    this.ros.callOnConnection(call);
  }
}

module.exports = Service;
