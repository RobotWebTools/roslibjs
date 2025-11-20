/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

import { EventEmitter } from "eventemitter3";
import type ActionClient from "./ActionClient.ts";
import type { actionlib_msgs } from "../types/actionlib_msgs.ts";
import { v4 as uuidv4 } from "uuid";

/**
 * An actionlib goal that is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - If a timeout occurred while sending a goal.
 */
export default class Goal<
  TGoal,
  TFeedback = unknown,
  TResult = unknown,
> extends EventEmitter<{
  timeout: undefined;
  status: [actionlib_msgs.GoalStatus];
  feedback: [TFeedback];
  result: [TResult];
}> {
  isFinished = false;
  status?: actionlib_msgs.GoalStatus = undefined;
  result?: TResult = undefined;
  feedback?: TFeedback = undefined;
  // Create a random ID
  goalID = `goal_${uuidv4()}`;
  actionClient: ActionClient<TGoal, TFeedback, TResult>;
  goalMessage: { goal: TGoal; goal_id: actionlib_msgs.GoalID };
  /**
   * @param options
   * @param options.actionClient - The ROSLIB.ActionClient to use with this goal.
   * @param options.goalMessage - The JSON object containing the goal for the action server.
   */
  constructor({
    actionClient,
    goalMessage,
  }: {
    actionClient: ActionClient<TGoal, TFeedback, TResult>;
    goalMessage: TGoal;
  }) {
    super();
    this.actionClient = actionClient;

    // Fill in the goal message
    this.goalMessage = {
      goal_id: {
        stamp: {
          secs: 0,
          nsecs: 0,
        },
        id: this.goalID,
      },
      goal: goalMessage,
    };

    this.on("status", (status) => {
      this.status = status;
    });

    this.on("result", (result) => {
      this.isFinished = true;
      this.result = result;
    });

    this.on("feedback", (feedback) => {
      this.feedback = feedback;
    });

    // Add the goal
    this.actionClient.goals[this.goalID] = this;
  }
  /**
   * Send the goal to the action server.
   *
   * @param [timeout] - A timeout length for the goal's result.
   */
  send(timeout?: number) {
    this.actionClient.goalTopic.publish(this.goalMessage);
    if (timeout) {
      setTimeout(() => {
        if (!this.isFinished) {
          this.emit("timeout");
        }
      }, timeout);
    }
  }
  /**
   * Cancel the current goal.
   */
  cancel() {
    const cancelMessage = {
      id: this.goalID,
    };
    this.actionClient.cancelTopic.publish(cancelMessage);
  }
}
