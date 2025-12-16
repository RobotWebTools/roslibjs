/**
 * @fileOverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

import { GoalStatus } from "./GoalStatus.ts";
import type { RosbridgeSendActionGoalMessage } from "../types/protocol.ts";
import {
  isRosbridgeActionFeedbackMessage,
  isRosbridgeActionResultMessage,
  isRosbridgeCancelActionGoalMessage,
  isRosbridgeSendActionGoalMessage,
} from "../types/protocol.ts";
import type Ros from "./Ros.ts";
import { v4 as uuidv4 } from "uuid";

class GoalError extends Error {
  override name = "GoalError";
  constructor(status: GoalStatus, errorValue?: string) {
    super(`${makeErrorMessage(status)}${errorValue ? `: ${errorValue}` : ""}`);
  }
}

function makeErrorMessage(status: GoalStatus) {
  switch (status) {
    case GoalStatus.STATUS_CANCELED:
      return `Action was canceled`;
    case GoalStatus.STATUS_ABORTED:
      return `Action was aborted`;
    case GoalStatus.STATUS_CANCELING:
      return `Action is canceling`;
    case GoalStatus.STATUS_UNKNOWN:
      return `Action status unknown`;
    default:
      return `Action failed with status ${String(status)}`;
  }
}

/**
 * A ROS 2 action client.
 */
export default class Action<
  TGoal = unknown,
  TFeedback = unknown,
  TResult = unknown,
> {
  isAdvertised = false;
  #actionCallback: ((goal: TGoal, id: string) => void) | null = null;
  #cancelCallback: ((id: string) => void) | null = null;
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
   * @param [feedbackCallback] - The callback function when the action publishes feedback.
   * @param [failedCallback] - The callback function when the action failed.
   */
  sendGoal(
    goal: TGoal,
    resultCallback: (result: TResult) => void,
    feedbackCallback?: (feedback: TFeedback) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    if (this.isAdvertised) {
      return;
    }

    const actionGoalId = `send_action_goal:${this.name}:${uuidv4()}`;
    this.ros.on(actionGoalId, (message) => {
      if (isRosbridgeActionResultMessage<TResult>(message)) {
        const status = message.status as GoalStatus;

        if (!message.result) {
          failedCallback(String(new GoalError(status, message.values)));
        } else if (status !== GoalStatus.STATUS_SUCCEEDED) {
          failedCallback(
            String(new GoalError(status, JSON.stringify(message.values))),
          );
          // Check status code instead of result field to properly handle STATUS_CANCELED
        } else {
          resultCallback(message.values);
        }
      } else if (isRosbridgeActionFeedbackMessage<TFeedback>(message)) {
        feedbackCallback?.(message.values);
      }
    });
    this.ros.callOnConnection({
      op: "send_action_goal",
      id: actionGoalId,
      action: this.name,
      action_type: this.actionType,
      args: goal,
      feedback: true,
    });

    return actionGoalId;
  }

  /**
   * Cancels an action goal.
   *
   * @param id - The ID of the action goal to cancel.
   */
  cancelGoal(id: string) {
    this.ros.callOnConnection({
      op: "cancel_action_goal",
      id: id,
      action: this.name,
    });
  }

  /**
   * Cancels all action goals.
   */
  cancelAllGoals() {
    this.ros.callOnConnection({
      op: "call_service",
      service: `${this.name}/_action/cancel_goal`,
      args: {},
    });
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

    this.#actionCallback = actionCallback;
    this.#cancelCallback = cancelCallback;
    this.ros.on(this.name, (msg) => {
      if (isRosbridgeSendActionGoalMessage<TGoal>(msg)) {
        this.#executeAction(msg);
      } else {
        throw new Error(
          "Received unrelated message on Action server event stream!",
        );
      }
    });
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
  #executeAction(rosbridgeRequest: RosbridgeSendActionGoalMessage<TGoal>) {
    const id = rosbridgeRequest.id;

    // If a cancellation callback exists, call it when a cancellation event is emitted.
    if (typeof id === "string") {
      this.ros.on(id, (message) => {
        if (
          isRosbridgeCancelActionGoalMessage(message) &&
          this.#cancelCallback
        ) {
          this.#cancelCallback(id);
        }
      });
    }

    // Call the action goal execution function provided.
    if (this.#actionCallback) {
      if (rosbridgeRequest.args) {
        this.#actionCallback(rosbridgeRequest.args, id);
      } else {
        throw new Error(
          "Received Action goal with no arguments! This should never happen, because rosbridge should fill in blanks!",
        );
      }
    }
  }

  /**
   * Helper function to send action feedback inside an action handler.
   *
   * @param id - The action goal ID.
   * @param feedback - The feedback to send.
   */
  sendFeedback(id: string, feedback: TFeedback) {
    this.ros.callOnConnection({
      op: "action_feedback",
      id: id,
      action: this.name,
      values: feedback,
    });
  }

  /**
   * Helper function to set an action as succeeded.
   *
   * @param id - The action goal ID.
   * @param result - The result to set.
   */
  setSucceeded(id: string, result: TResult) {
    this.ros.callOnConnection({
      op: "action_result",
      id: id,
      action: this.name,
      values: result,
      status: GoalStatus.STATUS_SUCCEEDED,
      result: true,
    });
  }

  /**
   * Helper function to set an action as canceled.
   *
   * @param id - The action goal ID.
   * @param result - The result to set.
   */
  setCanceled(id: string, result: TResult) {
    this.ros.callOnConnection({
      op: "action_result",
      id: id,
      action: this.name,
      values: result,
      status: GoalStatus.STATUS_CANCELED,
      result: true,
    });
  }

  /**
   * Helper function to set an action as failed.
   *
   * @param id - The action goal ID.
   */
  setFailed(id: string) {
    this.ros.callOnConnection({
      op: "action_result",
      id: id,
      action: this.name,
      status: GoalStatus.STATUS_ABORTED,
      result: false,
    });
  }
}
