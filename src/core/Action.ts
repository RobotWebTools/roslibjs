/**
 * @fileOverview
 * @author Sebastian Castro - sebastian.castro@picknik.ai
 */

import { GoalStatus } from "./GoalStatus.ts";
import type Ros from "./Ros.js";
import { v4 as uuidv4 } from "uuid";
import type { ActionIdString } from "../types/emitted_events.js";
import type {
  AnyActionOp,
  SendActionGoalOp,
  CancelActionGoalOp,
  ActionFeedbackOp,
  ActionResultSuccessOp,
  ActionResultFailedOp,
} from "../types/protocol.js";

type ActionCallback<TGoal extends object> = (
  goal: TGoal,
  id: string | undefined,
) => void;
type ActionCancelCallback = (id: string) => void;

interface ActionOptions {
  /**
   * The ROSLIB.Ros connection handle.
   */
  ros: Ros;
  /**
   * The action name, like '/fibonacci'.
   */
  name: string;
  /**
   * The action type, like 'example_interfaces/Fibonacci'.
   */
  actionType: string;
}

/**
 * A ROS 2 action client.
 */
export default class Action<
  TGoal extends object = object,
  TFeedback extends object = object,
  TResult extends object = object,
> {
  isAdvertised = false;
  #actionCallback: ActionCallback<TGoal> | null = null;
  #cancelCallback: ActionCancelCallback | null = null;
  ros: Ros;
  name: string;
  actionType: string;

  constructor({ ros, name, actionType }: ActionOptions) {
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
    failedCallback: (error: string) => void = console.error,
  ) {
    if (this.isAdvertised) {
      return;
    }

    const actionGoalId: ActionIdString = `send_action_goal:${this.name}:${uuidv4()}`;

    this.ros.on(
      actionGoalId,
      (message: AnyActionOp<TGoal, TFeedback, TResult>) => {
        if (message.op === "action_result") {
          if (!message.result) {
            failedCallback(message.values ?? "");
          } else {
            resultCallback(message.values);
          }
        } else if (message.op === "action_feedback") {
          feedbackCallback?.(message.values);
        }
      },
    );

    const call: SendActionGoalOp<TGoal> = {
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
    const call: CancelActionGoalOp = {
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
    actionCallback: ActionCallback<TGoal>,
    cancelCallback: ActionCancelCallback,
  ) {
    if (this.isAdvertised || typeof actionCallback !== "function") {
      return;
    }

    this.#actionCallback = actionCallback;
    this.#cancelCallback = cancelCallback;
    this.ros.on(this.name, (msg: AnyActionOp<TGoal, TFeedback, TResult>) => {
      if (msg.op !== "send_action_goal") {
        throw new Error(
          "Received unrelated message on Action server event stream!",
        );
      }

      this.#executeAction(msg);
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
  #executeAction(rosbridgeRequest: SendActionGoalOp<TGoal>) {
    const id = rosbridgeRequest.id;

    // If a cancellation callback exists, call it when a cancellation event is emitted.
    if (typeof id === "string") {
      this.ros.on(id, (message: AnyActionOp<TGoal, TFeedback, TResult>) => {
        if (message.op === "cancel_action_goal" && this.#cancelCallback) {
          this.#cancelCallback(id);
        }
      });
    }

    // Call the action goal execution function provided.
    if (this.#actionCallback) {
      if (!rosbridgeRequest.args) {
        throw new Error(
          "Received Action goal with no arguments! This should never happen, because rosbridge should fill in blanks!",
        );
      }
      this.#actionCallback(rosbridgeRequest.args, id);
    }
  }

  /**
   * Helper function to send action feedback inside an action handler.
   *
   * @param id - The action goal ID.
   * @param feedback - The feedback to send.
   */
  sendFeedback(id: string, feedback: TFeedback) {
    const call: ActionFeedbackOp<TFeedback> = {
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
    const call: ActionResultSuccessOp<TResult> = {
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
    const call: ActionResultSuccessOp<TResult> = {
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
    const call: ActionResultFailedOp = {
      op: "action_result",
      id: id,
      action: this.name,
      status: GoalStatus.STATUS_ABORTED,
      result: false,
    };
    this.ros.callOnConnection(call);
  }
}
