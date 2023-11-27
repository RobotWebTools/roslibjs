export = Service;
/**
 * A ROS service client.
 * @template T, U
 */
declare class Service<T, U> extends EventEmitter2 {
    /**
     * @param {Object} options
     * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
     * @param {string} options.name - The service name, like '/add_two_ints'.
     * @param {string} options.serviceType - The service type, like 'rospy_tutorials/AddTwoInts'.
     */
    constructor(options: {
        ros: Ros;
        name: string;
        serviceType: string;
    });
    ros: Ros;
    name: string;
    serviceType: string;
    isAdvertised: boolean;
    _serviceCallback: ((request: ServiceRequest<T>, response: any) => any) | null;
    /**
     * @callback callServiceCallback
     *  @param {U} response - The response from the service request.
     */
    /**
     * @callback callServiceFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Call the service. Returns the service response in the
     * callback. Does nothing if this service is currently advertised.
     *
     * @param {T} request - The ROSLIB.ServiceRequest to send.
     * @param {callServiceCallback} [callback] - Function with the following params:
     * @param {callServiceFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    callService(request: T, callback?: ((response: U) => any) | undefined, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback advertiseCallback
     * @param {ServiceRequest<T>} request - The service request.
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
    advertise(callback: (request: ServiceRequest<T>, response: any) => any): void;
    unadvertise(): void;
    _serviceResponse(rosbridgeRequest: any): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import Ros = require("../core/Ros");
import ServiceRequest = require("./ServiceRequest");
