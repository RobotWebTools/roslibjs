/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

import type Ros from "../core/Ros.ts";
import Topic from "../core/Topic.ts";
import { EventEmitter } from "eventemitter3";
import type { actionlib_msgs } from "../types/actionlib_msgs.ts";
import type Goal from "./Goal.ts";

/**
 * An actionlib action client.
 *
 * Emits the following events:
 *  * 'timeout' - If a timeout occurred while sending a goal.
 *  * 'status' - The status messages received from the action server.
 *  * 'feedback' - The feedback messages received from the action server.
 *  * 'result' - The result returned from the action server.
 *
 */
export default class ActionClient<
  TGoal = unknown,
  TFeedback = unknown,
  TResult = unknown,
> extends EventEmitter<{
  timeout: undefined;
}> {
  goals: Record<string, Goal<TGoal>> = {};
  /** flag to check if a status has been received */
  receivedStatus = false;
  ros: Ros;
  serverName: string;
  actionName: string;
  timeout?: number;
  omitFeedback?: boolean;
  omitStatus?: boolean;
  omitResult?: boolean;
  feedbackListener: Topic<{
    status: actionlib_msgs.GoalStatus;
    feedback: TFeedback;
  }>;
  statusListener: Topic<actionlib_msgs.GoalStatusArray>;
  resultListener: Topic<{
    status: actionlib_msgs.GoalStatus;
    result: TResult;
  }>;
  goalTopic: Topic<{ goal: TGoal; goal_id: actionlib_msgs.GoalID }>;
  cancelTopic: Topic<Partial<actionlib_msgs.GoalID>>;
  /**
   * @param options
   * @param options.ros - The ROSLIB.Ros connection handle.
   * @param options.serverName - The action server name, like '/fibonacci'.
   * @param options.actionName - The action message name, like 'actionlib_tutorials/FibonacciAction'.
   * @param [options.timeout] - The timeout length when connecting to the action server.
   * @param [options.omitFeedback] - The flag to indicate whether to omit the feedback channel or not.
   * @param [options.omitStatus] - The flag to indicate whether to omit the status channel or not.
   * @param [options.omitResult] - The flag to indicate whether to omit the result channel or not.
   */
  constructor({
    ros,
    serverName,
    actionName,
    timeout,
    omitFeedback,
    omitStatus,
    omitResult,
  }: {
    ros: Ros;
    serverName: string;
    actionName: string;
    timeout?: number;
    omitFeedback?: boolean;
    omitStatus?: boolean;
    omitResult?: boolean;
  }) {
    super();
    this.ros = ros;
    this.serverName = serverName;
    this.actionName = actionName;
    this.timeout = timeout;
    this.omitFeedback = omitFeedback;
    this.omitStatus = omitStatus;
    this.omitResult = omitResult;

    // create the topics associated with actionlib
    this.feedbackListener = new Topic({
      ros: this.ros,
      name: `${this.serverName}/feedback`,
      messageType: `${this.actionName}Feedback`,
    });

    this.statusListener = new Topic({
      ros: this.ros,
      name: `${this.serverName}/status`,
      messageType: "actionlib_msgs/GoalStatusArray",
    });

    this.resultListener = new Topic({
      ros: this.ros,
      name: `${this.serverName}/result`,
      messageType: `${this.actionName}Result`,
    });

    this.goalTopic = new Topic({
      ros: this.ros,
      name: `${this.serverName}/goal`,
      messageType: `${this.actionName}Goal`,
    });

    this.cancelTopic = new Topic({
      ros: this.ros,
      name: `${this.serverName}/cancel`,
      messageType: "actionlib_msgs/GoalID",
    });

    // advertise the goal and cancel topics
    this.goalTopic.advertise();
    this.cancelTopic.advertise();

    // subscribe to the status topic
    if (!this.omitStatus) {
      this.statusListener.subscribe((statusMessage) => {
        this.receivedStatus = true;
        statusMessage.status_list.forEach((status) => {
          const goal = this.goals[status.goal_id.id];
          if (goal) {
            goal.emit("status", status);
          }
        });
      });
    }

    // subscribe the the feedback topic
    if (!this.omitFeedback) {
      this.feedbackListener.subscribe((feedbackMessage) => {
        const goal = this.goals[feedbackMessage.status.goal_id.id];
        if (goal) {
          goal.emit("status", feedbackMessage.status);
          goal.emit("feedback", feedbackMessage.feedback);
        }
      });
    }

    // subscribe to the result topic
    if (!this.omitResult) {
      this.resultListener.subscribe((resultMessage) => {
        const goal = this.goals[resultMessage.status.goal_id.id];

        if (goal) {
          goal.emit("status", resultMessage.status);
          goal.emit("result", resultMessage.result);
        }
      });
    }

    // If timeout specified, emit a 'timeout' event if the action server does not respond
    if (this.timeout) {
      setTimeout(() => {
        if (!this.receivedStatus) {
          this.emit("timeout");
        }
      }, this.timeout);
    }
  }
  /**
   * Cancel all goals associated with this ActionClient.
   */
  cancel() {
    const cancelMessage = {};
    this.cancelTopic.publish(cancelMessage);
  }
  /**
   * Unsubscribe and unadvertise all topics associated with this ActionClient.
   */
  dispose() {
    this.goalTopic.unadvertise();
    this.cancelTopic.unadvertise();
    if (!this.omitStatus) {
      this.statusListener.unsubscribe();
    }
    if (!this.omitFeedback) {
      this.feedbackListener.unsubscribe();
    }
    if (!this.omitResult) {
      this.resultListener.unsubscribe();
    }
  }
}
