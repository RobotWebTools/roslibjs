/**
 * @fileOverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

import { EventEmitter } from 'eventemitter3';
import Ros from '../core/Ros.js';
import { GoalStatus } from '../core/GoalStatus.ts';

/**
 * A ROS 2 action client.
 * @template TGoal, TFeedback, TResult
 */
export default class Action extends EventEmitter {
  isAdvertised = false;
  /**
   * @callback advertiseActionCallback
   * @param {TGoal} goal - The action goal.
   * @param {string} id - The ID of the action goal to execute.
   */
  /**
   * @private
   * @type {advertiseActionCallback | null}
   */
  _actionCallback = null;
  /**
   * @callback advertiseCancelCallback
   * @param {string} id - The ID of the action goal to cancel.
   */
  /**
   * @private
   * @type {advertiseCancelCallback | null}
   */
  _cancelCallback = null;
  /**
   * @param {Object} options
   * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} options.name - The action name, like '/fibonacci'.
   * @param {string} options.actionType - The action type, like 'action_tutorials_interfaces/Fibonacci'.
   */
  constructor(options) {
    super();
    this.ros = options.ros;
    this.name = options.name;
    this.actionType = options.actionType;
  }

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
   * @param {TGoal} goal - The action goal to send.
   * @param {sendGoalResultCallback} resultCallback - The callback function when the action is completed.
   * @param {sendGoalFeedbackCallback} [feedbackCallback] - The callback function when the action pulishes feedback.
   * @param {sendGoalFailedCallback} [failedCallback] - The callback function when the action failed.
   */
  sendGoal(goal, resultCallback, feedbackCallback, failedCallback) {
    if (this.isAdvertised) {
      return;
    }

    var actionGoalId =
      'send_action_goal:' + this.name + ':' + ++this.ros.idCounter;

    if (resultCallback || failedCallback) {
      this.ros.on(actionGoalId, function (message) {
        if (message.result !== undefined && message.result === false) {
          if (typeof failedCallback === 'function') {
            failedCallback(message.values);
          }
        } else if (
          message.op === 'action_feedback' &&
          typeof feedbackCallback === 'function'
        ) {
          feedbackCallback(message.values);
        } else if (
          message.op === 'action_result' &&
          typeof resultCallback === 'function'
        ) {
          resultCallback(message.values);
        }
      });
    }

    var call = {
      op: 'send_action_goal',
      id: actionGoalId,
      action: this.name,
      action_type: this.actionType,
      args: goal,
      feedback: true,
    };
    this.ros.callOnConnection(call);

    return actionGoalId;
  }

  /**
   * Cancels an action goal.
   *
   * @param {string} id - The ID of the action goal to cancel.
   */
  cancelGoal(id) {
    var call = {
      op: 'cancel_action_goal',
      id: id,
      action: this.name
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Advertise the action. This turns the Action object from a client
   * into a server. The callback will be called with every goal sent to this action.
   *
   * @param {advertiseActionCallback} actionCallback - This works similarly to the callback for a C++ action.
   * @param {advertiseCancelCallback} cancelCallback - A callback function to execute when the action is canceled.
   */
  advertise(actionCallback, cancelCallback) {
    if (this.isAdvertised || typeof actionCallback !== 'function') {
      return;
    }

    this._actionCallback = actionCallback;
    this._cancelCallback = cancelCallback;
    this.ros.on(this.name, this._executeAction.bind(this));
    this.ros.callOnConnection({
      op: 'advertise_action',
      type: this.actionType,
      action: this.name
    });
    this.isAdvertised = true;
  }

  /**
   * Unadvertise a previously advertised action.
   */
  unadvertise() {
    if (!this.isAdvertised) {
      return;
    }
    this.ros.callOnConnection({
      op: 'unadvertise_action',
      action: this.name
    });
    this.isAdvertised = false;
  }

  /**
   * Helper function that executes an action by calling the provided
   * action callback with the auto-generated ID as a user-accessible input.
   * Should not be called manually.
   *
   * @param {Object} rosbridgeRequest - The rosbridge request containing the action goal to send and its ID.
   * @param {string} rosbridgeRequest.id - The ID of the action goal.
   * @param {TGoal} rosbridgeRequest.args - The arguments of the action goal.
   */
  _executeAction(rosbridgeRequest) {
    var id = rosbridgeRequest.id;

    // If a cancellation callback exists, call it when a cancellation event is emitted.
    if (typeof id === 'string') {
      this.ros.on(id, (message) => {
        if (
          message.op === 'cancel_action_goal' &&
          typeof this._cancelCallback === 'function'
        ) {
          this._cancelCallback(id);
        }
      });
    }

    // Call the action goal execution function provided.
    if (typeof this._actionCallback === 'function') {
      this._actionCallback(rosbridgeRequest.args, id);
    }
  }

  /**
   * Helper function to send action feedback inside an action handler.
   *
   * @param {string} id - The action goal ID.
   * @param {TFeedback} feedback - The feedback to send.
   */
  sendFeedback(id, feedback) {
    var call = {
      op: 'action_feedback',
      id: id,
      action: this.name,
      values: feedback
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Helper function to set an action as succeeded.
   *
   * @param {string} id - The action goal ID.
   * @param {TResult} result - The result to set.
   */
  setSucceeded(id, result) {
    var call = {
      op: 'action_result',
      id: id,
      action: this.name,
      values: result,
      status: GoalStatus.STATUS_SUCCEEDED,
      result: true
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Helper function to set an action as canceled.
   *
   * @param {string} id - The action goal ID.
   * @param {TResult} result - The result to set.
   */
  setCanceled(id, result) {
    var call = {
      op: 'action_result',
      id: id,
      action: this.name,
      values: result,
      status: GoalStatus.STATUS_CANCELED,
      result: true
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Helper function to set an action as failed.
   *
   * @param {string} id - The action goal ID.
   */
  setFailed(id) {
    var call = {
      op: 'action_result',
      id: id,
      action: this.name,
      status: GoalStatus.STATUS_ABORTED,
      result: false
    };
    this.ros.callOnConnection(call);
  }
}
