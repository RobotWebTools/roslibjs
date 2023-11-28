export = Action;
/**
 * A ROS action client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like '/fibonacci'
 *   * actionType - the action type, like 'action_tutorials_interfaces/Fibonacci'
 */
declare function Action(options: any): void;
declare class Action {
    /**
     * A ROS action client.
     *
     * @constructor
     * @params options - possible keys include:
     *   * ros - the ROSLIB.Ros connection handle
     *   * name - the service name, like '/fibonacci'
     *   * actionType - the action type, like 'action_tutorials_interfaces/Fibonacci'
     */
    constructor(options: any);
    ros: any;
    name: any;
    actionType: any;
    isAdvertised: boolean;
    _serviceCallback: any;
    __proto__: EventEmitter2;
    /**
     * Calls the service. Returns the service response in the
     * callback. Does nothing if this service is currently advertised.
     *
     * @param request - the ROSLIB.ServiceRequest to send
     * @param resultCallback - function with params:
     *   * result - the result from the action
     * @param feedbackCallback - the callback function when the action publishes feedback (optional). Params:
     *   * feedback - the feedback from the action
     * @param failedCallback - the callback function when the action failed (optional). Params:
     *   * error - the error message reported by ROS
     */
    sendGoal(request: any, resultCallback: any, feedbackCallback: any, failedCallback: any): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
