/**
 * @fileOverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

import { EventEmitter } from "eventemitter3";
import { GoalStatus } from "./GoalStatus.ts";
import {
  isRosbridgeActionFeedbackMessage,
  isRosbridgeActionResultMessage,
  isRosbridgeCancelActionGoalMessage,
} from "../types/protocol.ts";
import Ros from "./Ros.js";

/**
 * A ROS 2 action client.
 * @template TGoal, TFeedback, TResult
 */
export default class Action<
  TGoal = unknown,
  TFeedback = unknown,
  TResult = unknown,
> extends EventEmitter {
  isAdvertised = false;
  /**
   * @private
   */
  _actionCallback: ((goal: TGoal, id: string) => void) | null = null;
  /**
   * @private
   */
  _cancelCallback: ((id: string) => void) | null = null;
  ros: Ros;
  name: string;
  actionType: string;
  /**
   * @param options
   * @param options.ros - The ROSLIB.Ros connection handle.
   * @param options.name - The action name, like '/fibonacci'.
   * @param options.actionType - The action type, like 'example_interfaces/Fibonacci'.
   */
  constructor({
    ros,
    name,
    actionType,
  }: {
    ros: Ros;
    name: string;
    actionType: string;
  }) {
    super();
    this.ros = ros;
    this.name = name;
    this.actionType = actionType;
  }

  /**
   * Sends an action goal. Returns the feedback in the feedback callback while the action is running
   * and the result in the result callback when the action is completed.
   * Does nothing if this action is currently advertised.
   *
   * @param goal - The action goal to send.
   * @param resultCallback - The callback function when the action is completed.
   * @param [feedbackCallback] - The callback function when the action pulishes feedback.
   * @param [failedCallback] - The callback function when the action failed.
   */
  sendGoal(
    goal: TGoal,
    resultCallback: (result: TResult) => void,
    feedbackCallback?: (feedback: TFeedback) => void,
    failedCallback?: (error: string) => void,
  ) {
    if (this.isAdvertised) {
      return;
    }

    const actionGoalId =
      "send_action_goal:" + this.name + ":" + ++this.ros.idCounter;

    if (resultCallback || failedCallback) {
      this.ros.on(actionGoalId, function (message) {
        if (message.result !== undefined && message.result === false) {
          if (typeof failedCallback === "function") {
            failedCallback(message.values);
          }
        } else if (
          isRosbridgeActionFeedbackMessage(message) &&
          typeof feedbackCallback === "function"
        ) {
          // @ts-expect-error -- can't do generic type guards in this file until it's migrated to typescript
          feedbackCallback(message.values);
        } else if (
          isRosbridgeActionResultMessage(message) &&
          typeof resultCallback === "function"
        ) {
          // @ts-expect-error -- can't do generic type guards in this file until it's migrated to typescript
          resultCallback(message.values);
        }
      });
    }

    const call = {
      op: "send_action_goal",
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
   * @param id - The ID of the action goal to cancel.
   */
  cancelGoal(id: string) {
    const call = {
      op: "cancel_action_goal",
      id: id,
      action: this.name,
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Advertise the action. This turns the Action object from a client
   * into a server. The callback will be called with every goal sent to this action.
   *
   * @param actionCallback - This works similarly to the callback for a C++ action.
   * @param cancelCallback - A callback function to execute when the action is canceled.
   */
  advertise(
    actionCallback: (goal: TGoal, id: string) => void,
    cancelCallback: (id: string) => void,
  ) {
    if (this.isAdvertised || typeof actionCallback !== "function") {
      return;
    }

    this._actionCallback = actionCallback;
    this._cancelCallback = cancelCallback;
    this.ros.on(this.name, this._executeAction.bind(this));
    this.ros.callOnConnection({
      op: "advertise_action",
      type: this.actionType,
      action: this.name,
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
      op: "unadvertise_action",
      action: this.name,
    });
    this.isAdvertised = false;
  }

  /**
   * Helper function that executes an action by calling the provided
   * action callback with the auto-generated ID as a user-accessible input.
   * Should not be called manually.
   *
   * @param rosbridgeRequest - The rosbridge request containing the action goal to send and its ID.
   * @param rosbridgeRequest.id - The ID of the action goal.
   * @param rosbridgeRequest.args - The arguments of the action goal.
   */
  _executeAction(rosbridgeRequest: { id: string; args: TGoal }) {
    const id = rosbridgeRequest.id;

    // If a cancellation callback exists, call it when a cancellation event is emitted.
    if (typeof id === "string") {
      this.ros.on(id, (message) => {
        if (
          isRosbridgeCancelActionGoalMessage(message) &&
          typeof this._cancelCallback === "function"
        ) {
          this._cancelCallback(id);
        }
      });
    }

    // Call the action goal execution function provided.
    if (typeof this._actionCallback === "function") {
      this._actionCallback(rosbridgeRequest.args, id);
    }
  }

  /**
   * Helper function to send action feedback inside an action handler.
   *
   * @param id - The action goal ID.
   * @param feedback - The feedback to send.
   */
  sendFeedback(id: string, feedback: TFeedback) {
    const call = {
      op: "action_feedback",
      id: id,
      action: this.name,
      values: feedback,
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Helper function to set an action as succeeded.
   *
   * @param id - The action goal ID.
   * @param result - The result to set.
   */
  setSucceeded(id: string, result: TResult) {
    const call = {
      op: "action_result",
      id: id,
      action: this.name,
      values: result,
      status: GoalStatus.STATUS_SUCCEEDED,
      result: true,
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Helper function to set an action as canceled.
   *
   * @param id - The action goal ID.
   * @param result - The result to set.
   */
  setCanceled(id: string, result: TResult) {
    const call = {
      op: "action_result",
      id: id,
      action: this.name,
      values: result,
      status: GoalStatus.STATUS_CANCELED,
      result: true,
    };
    this.ros.callOnConnection(call);
  }

  /**
   * Helper function to set an action as failed.
   *
   * @param id - The action goal ID.
   */
  setFailed(id: string) {
    const call = {
      op: "action_result",
      id: id,
      action: this.name,
      status: GoalStatus.STATUS_ABORTED,
      result: false,
    };
    this.ros.callOnConnection(call);
  }
}
