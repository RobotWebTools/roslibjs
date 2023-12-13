export = Action;
/**
 * A ROS 2 action client.
 * @template TGoal, TFeedback, TResult
 */
declare class Action<TGoal, TFeedback, TResult> extends EventEmitter2 {
    /**
     * @param {Object} options
     * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
     * @param {string} options.name - The action name, like '/fibonacci'.
     * @param {string} options.actionType - The action type, like 'action_tutorials_interfaces/Fibonacci'.
     */
    constructor(options: {
        ros: Ros;
        name: string;
        actionType: string;
    });
    ros: Ros;
    name: string;
    actionType: string;
    isAdvertised: boolean;
    _actionCallback: ((goal: TGoal, id: string) => any) | null;
    _cancelCallback: ((id: string) => any) | null;
    /**
     * @callback sendGoalResultCallback
     * @param {TResult} result - The result from the action.
     */
    /**
     * @callback sendGoalFeedbackCallback
     * @param {TFeedback} feedback - The feedback from the action.
     */
    /**
     * @callback sendGoalFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Sends an action goal. Returns the feedback in the feedback callback while the action is running
     * and the result in the result callback when the action is completed.
     * Does nothing if this action is currently advertised.
     *
     * @param {TGoal} goal - The ROSLIB.ActionGoal to send.
     * @param {sendGoalResultCallback} resultCallback - The callback function when the action is completed.
     * @param {sendGoalFeedbackCallback} [feedbackCallback] - The callback function when the action pulishes feedback.
     * @param {sendGoalFailedCallback} [failedCallback] - The callback function when the action failed.
     */
    sendGoal(goal: TGoal, resultCallback: (result: TResult) => any, feedbackCallback?: ((feedback: TFeedback) => any) | undefined, failedCallback?: ((error: string) => any) | undefined): string | undefined;
    /**
     * Cancels an action goal.
     *
     * @param {string} id - The ID of the action goal to cancel.
     */
    cancelGoal(id: string): void;
    /**
     * @callback advertiseActionCallback
     * @param {TGoal} goal - The action goal.
     * @param {string} id - The ID of the action goal to execute.
     */
    /**
     * @callback advertiseCancelCallback
     * @param {string} id - The ID of the action goal to cancel.
     */
    /**
     * Advertise the action. This turns the Action object from a client
     * into a server. The callback will be called with every goal sent to this action.
     *
     * @param {advertiseActionCallback} actionCallback - This works similarly to the callback for a C++ action.
     * @param {advertiseCancelCallback} cancelCallback - A callback function to execute when the action is canceled.
     */
    advertise(actionCallback: (goal: TGoal, id: string) => any, cancelCallback: (id: string) => any): void;
    /**
     * Unadvertise a previously advertised action.
     */
    unadvertise(): void;
    /**
     * Helper function that executes an action by calling the provided
     * action callback with the auto-generated ID as a user-accessible input.
     * Should not be called manually.
     *
     * @param {Object} rosbridgeRequest - The ROSLIB.ActionGoal to send.
     * @param {string} rosbridgeRequest.id - The ID of the action goal.
     */
    _executeAction(rosbridgeRequest: {
        id: string;
    }): void;
    /**
     * Helper function to send action feedback inside an action handler.
     *
     * @param {string} id - The action goal ID.
     * @param {ActionFeedback<TFeedback>} feedback - The feedback to send.
     */
    sendFeedback(id: string, feedback: ActionFeedback<TFeedback>): void;
    /**
     * Helper function to set an action as succeeded.
     *
     * @param {string} id - The action goal ID.
     * @param {ActionResult} result - The result to set.
     */
    setSucceeded(id: string, result: ActionResult<any>): void;
    /**
     * Helper function to set an action as failed.
     *
     * @param {string} id - The action goal ID.
     */
    setFailed(id: string): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import Ros = require("../core/Ros");
import ActionFeedback = require("./ActionFeedback");
import ActionResult = require("./ActionResult");
