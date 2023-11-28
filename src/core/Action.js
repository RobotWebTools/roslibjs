/**
 * @fileOverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

var ActionGoal = require('./ActionGoal');
var ActionFeedback = require('./ActionFeedback');
var ActionResult = require('./ActionResult');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var Ros = require('../core/Ros');

/**
 * A ROS 2 action client.
 * @template TGoal, TFeedback, TResult
 */
class Action extends EventEmitter2 {
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
    this.isAdvertised = false;

    this._actionCallback = null;
    this._cancelCallback = null;
  }

  /**
   * @callback sendGoalResultCallback
   *  @param {TResult} result - The result from the action.
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
  sendGoal(goal, resultCallback, feedbackCallback, failedCallback) {
    if (this.isAdvertised) {
      return;
    }

    var actionGoalId = 'send_action_goal:' + this.name + ':' + (++this.ros.idCounter);

    if (resultCallback || failedCallback) {
      this.ros.on(actionGoalId, function(message) {
        if (message.result !== undefined && message.result === false) {
          if (typeof failedCallback === 'function') {
            failedCallback(message.values);
          }
        } else if (message.op === 'action_feedback' && typeof feedbackCallback === 'function') {
          // @ts-expect-error -- can't figure out how to get ActionFeedback to play nice in typescript here
          feedbackCallback(new ActionFeedback(message.values));
        } else if (message.op === 'action_result' && typeof resultCallback === 'function') {
          // @ts-expect-error -- can't figure out how to get ActionResult to play nice in typescript here
          resultCallback(new ActionResult(message.values));
        }
      });
    }

    var call = {
      op : 'send_action_goal',
      id : actionGoalId,
      action : this.name,
      action_type: this.actionType,
      args : goal,
      feedback : true,
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
      action: this.name,
    };
    this.ros.callOnConnection(call);
  }

  /**
   * @callback advertiseCallback
   * @param {TGoal} goal - The action goal.
   * @param {Object} response - An empty dictionary. Take care not to overwrite this. Instead, only modify the values within.
   *     It should return true if the action has finished successfully,
   *     i.e., without any fatal errors.
   */
  /**
   * Advertise the action. This turns the Action object from a client
   * into a server. The callback will be called with every goal sent to this action.
   *
   * @param {advertiseCallback} callback - This works similarly to the callback for a C++ action.
   */
  advertise(callback) {
    if (this.isAdvertised || typeof callback !== 'function') {
      return;
    }

    this._actionCallback = callback;
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
   * @param {Object} rosbridgeRequest - The ROSLIB.ActionGoal to send.
   * @param {string} rosbridgeRequest.id - The ID of the action goal.
   */
  _executeAction(rosbridgeRequest) {
    var id;
    if (rosbridgeRequest.id) {
      id = rosbridgeRequest.id;
    }

    // @ts-expect-error -- possibly null
    this._actionCallback(rosbridgeRequest.args, id);
  }

  /**
   * Helper function to send action feedback inside an action handler.
   *
   * @param {string} id - The action goal ID.
   * @param {ActionFeedback<TFeedback>} feedback - The feedback to send.
   */
  sendFeedback(id, feedback) {
    var call = {
      op: 'action_feedback',
      id: id,
      action: this.name,
      values: new ActionFeedback(feedback),
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Helper function to set an action as succeeded.
   *
   * @param {string} id - The action goal ID.
   * @param {ActionResult} result - The result to set.
   */
  setSucceeded(id, result) {
    var call = {
      op: 'action_result',
      id: id,
      action: this.name,
      values: new ActionResult(result),
      result: true,
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
      result: false,
    };
    this.ros.callOnConnection(call);
  }
}

module.exports = Action;
