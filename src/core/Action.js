/**
 * @fileoverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

var ActionGoal = require('./ActionGoal');
var ActionFeedback = require('./ActionFeedback');
var ActionResult = require('./ActionResult');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * A ROS 2 action client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like '/fibonacci'
 *   * actionType - the action type, like 'action_tutorials_interfaces/Fibonacci'
 */
function Action(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.actionType = options.actionType;
  this.isAdvertised = false;

  this._actionCallback = null;
  this._cancelCallback = null;
}
Action.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Sends an action goal. Returns the feedback in the feedback callback while the action is running
 * and the result in the result callback when the action is completed.
 * Does nothing if this action is currently advertised.
 *
 * @param goal - the ROSLIB.ActionGoal to send
 * @param resultCallback - the callback function when the action is completed with params:
 *   * result - the result from the action
 * @param feedbackCallback - the callback function when the action publishes feedback (optional). Params:
 *   * feedback - the feedback from the action
 * @param failedCallback - the callback function when the action failed (optional). Params:
 *   * error - the error message reported by ROS
 */
Action.prototype.sendGoal = function(goal, resultCallback, feedbackCallback, failedCallback) {
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
        feedbackCallback(new ActionFeedback(message.values));
      } else if (message.op === 'action_result' && typeof resultCallback === 'function') {
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
};

/**
 * Cancels an action goal.
 * 
 * @param id - the ID of the action goal to cancel.
 */
Action.prototype.cancelGoal = function(id) {
  var call = {
    op: 'cancel_action_goal',
    id: id,
    action: this.name,
  };
  this.ros.callOnConnection(call);
};

/**
 * Advertise the action. This turns the Action object from a client
 * into a server. The callback will be called with every goal sent to this action.
 *
 * @param callback - This works similarly to the callback for a C++ action and should take the following params:
 *   * goal - the action goal
 *   It should return true if the action has finished successfully,
 *   i.e. without any fatal errors.
 */
Action.prototype.advertise = function(callback) {
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
};

/**
 * Unadvertise a previously advertised action.
 */
Action.prototype.unadvertise = function() {
  if (!this.isAdvertised) {
    return;
  }
  this.ros.callOnConnection({
    op: 'unadvertise_action',
    action: this.name
  });
  this.isAdvertised = false;
};

/**
 * Helper function that executes an action by calling the provided
 * action callback with the auto-generated ID as a user-accessible input.
 * Should not be called manually.
 * 
 * @param rosbridgeRequest - The ROSLIB.ActionGoal to send
 */
Action.prototype._executeAction = function(rosbridgeRequest) {
  var id;
  if (rosbridgeRequest.id) {
    id = rosbridgeRequest.id;
  }

  this._actionCallback(rosbridgeRequest.args, id);
};

/**
 * Helper function to send action feedback inside an action handler.
 *
 * @param id - The action goal ID.
 * @param feedback - The feedback to send.
 */
Action.prototype.sendFeedback = function(id, feedback) {
  var call = {
    op: 'action_feedback',
    id: id,
    action: this.name,
    values: new ActionFeedback(feedback),
  };
  this.ros.callOnConnection(call);
};

/**
 * Helper function to set an action as succeeded.
 *
 * @param id - The action goal ID.
 * @param result - The result to set.
 */
Action.prototype.setSucceeded = function(id, result) {
  var call = {
    op: 'action_result',
    id: id,
    action: this.name,
    values: new ActionResult(result),
    result: true,
  };
  this.ros.callOnConnection(call);
};

/**
 * Helper function to set an action as failed.
 *
 * @param id - The action goal ID.
 */
Action.prototype.setFailed = function(id) {
  var call = {
    op: 'action_result',
    id: id,
    action: this.name,
    result: false,
  };
  this.ros.callOnConnection(call);
};

module.exports = Action;
