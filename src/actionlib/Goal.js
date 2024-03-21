/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

import { EventEmitter } from 'eventemitter3';
import Message from '../core/Message.js';
import ActionClient from './ActionClient.js';

/**
 * An actionlib goal that is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - If a timeout occurred while sending a goal.
 */
export default class Goal extends EventEmitter {
  isFinished = false;
  status = undefined;
  result = undefined;
  feedback = undefined;
  // Create a random ID
  goalID = 'goal_' + Math.random() + '_' + new Date().getTime();
  /**
   * @param {Object} options
   * @param {ActionClient} options.actionClient - The ROSLIB.ActionClient to use with this goal.
   * @param {Object} options.goalMessage - The JSON object containing the goal for the action server.
   */
  constructor(options) {
    super();
    this.actionClient = options.actionClient;

    // Fill in the goal message
    this.goalMessage = {
      goal_id: {
        stamp: {
          secs: 0,
          nsecs: 0
        },
        id: this.goalID
      },
      goal: options.goalMessage
    };

    this.on('status', (status) => {
      this.status = status;
    });

    this.on('result', (result) => {
      this.isFinished = true;
      this.result = result;
    });

    this.on('feedback', (feedback) => {
      this.feedback = feedback;
    });

    // Add the goal
    this.actionClient.goals[this.goalID] = this;
  }
  /**
   * Send the goal to the action server.
   *
   * @param {number} [timeout] - A timeout length for the goal's result.
   */
  send(timeout) {
    this.actionClient.goalTopic.publish(this.goalMessage);
    if (timeout) {
      setTimeout(() => {
        if (!this.isFinished) {
          this.emit('timeout');
        }
      }, timeout);
    }
  }
  /**
   * Cancel the current goal.
   */
  cancel() {
    var cancelMessage = {
      id: this.goalID
    };
    this.actionClient.cancelTopic.publish(cancelMessage);
  }
}
