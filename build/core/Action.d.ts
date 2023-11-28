export = Action;
/**
 * A ROS 2 action client.
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
     * A ROS 2 action client.
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
    _actionCallback: any;
    _cancelCallback: any;
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
    sendGoal(request: any, resultCallback: any, feedbackCallback: any, failedCallback: any): string | undefined;
    cancelGoal(id: any): void;
    /**
     * Advertise the action. This turns the Action object from a client
     * into a server. The callback will be called with every goal sent to this action.
     *
     * @param callback - This works similarly to the callback for a C++ action and should take the following params:
     *   * goal - the action goal
     *   It should return true if the action has finished successfully,
     *   i.e. without any fatal errors.
     */
    advertise(callback: any): void;
    unadvertise(): void;
    _executeAction(rosbridgeRequest: any): void;
    sendFeedback(id: any, feedback: any): void;
    setSucceeded(id: any, result: any): void;
    setFailed(id: any): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
