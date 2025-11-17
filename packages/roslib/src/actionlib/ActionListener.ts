/**
 * @fileOverview
 * @author Justin Young - justin@oodar.com.au
 * @author Russell Toris - rctoris@wpi.edu
 */

import type Ros from "../core/Ros.ts";
import Topic from "../core/Topic.ts";
import { EventEmitter } from "eventemitter3";
import type { actionlib_msgs } from "../types/actionlib_msgs.ts";

/**
 * An actionlib action listener.
 *
 * Emits the following events:
 *  * 'status' - The status messages received from the action server.
 *  * 'feedback' - The feedback messages received from the action server.
 *  * 'result' - The result returned from the action server.
 *
 *
 */
export default class ActionListener<
  TGoal,
  TFeedback,
  TResult,
> extends EventEmitter<{
  status: actionlib_msgs.GoalStatus;
  feedback: [TFeedback];
  result: [TResult];
  goal: [TGoal];
}> {
  ros: Ros;
  serverName: string;
  actionName: string;
  /**
   * @param options
   * @param options.ros - The ROSLIB.Ros connection handle.
   * @param options.serverName - The action server name, like '/fibonacci'.
   * @param options.actionName - The action message name, like 'actionlib_tutorials/FibonacciAction'.
   */
  constructor({
    ros,
    serverName,
    actionName,
  }: {
    ros: Ros;
    serverName: string;
    actionName: string;
  }) {
    super();
    this.ros = ros;
    this.serverName = serverName;
    this.actionName = actionName;

    // create the topics associated with actionlib
    const goalListener = new Topic<TGoal>({
      ros: this.ros,
      name: `${this.serverName}/goal`,
      messageType: `${this.actionName}Goal`,
    });

    const feedbackListener = new Topic<{
      status: actionlib_msgs.GoalStatus;
      feedback: TFeedback;
    }>({
      ros: this.ros,
      name: `${this.serverName}/feedback`,
      messageType: `${this.actionName}Feedback`,
    });

    const statusListener = new Topic<actionlib_msgs.GoalStatusArray>({
      ros: this.ros,
      name: `${this.serverName}/status`,
      messageType: "actionlib_msgs/GoalStatusArray",
    });

    const resultListener = new Topic<{
      status: actionlib_msgs.GoalStatus;
      result: TResult;
    }>({
      ros: this.ros,
      name: `${this.serverName}/result`,
      messageType: `${this.actionName}Result`,
    });

    goalListener.subscribe((goalMessage) => {
      this.emit("goal", goalMessage);
    });

    statusListener.subscribe((statusMessage) => {
      statusMessage.status_list.forEach((status) => {
        this.emit("status", status);
      });
    });

    feedbackListener.subscribe((feedbackMessage) => {
      this.emit("status", feedbackMessage.status);
      this.emit("feedback", feedbackMessage.feedback);
    });

    // subscribe to the result topic
    resultListener.subscribe((resultMessage) => {
      this.emit("status", resultMessage.status);
      this.emit("result", resultMessage.result);
    });
  }
}
