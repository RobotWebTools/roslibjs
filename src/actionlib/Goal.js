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
  /**
   * @param {Object} options
   * @param {ActionClient} options.actionClient - The ROSLIB.ActionClient to use with this goal.
   * @param {Object} options.goalMessage - The JSON object containing the goal for the action server.
   */
  constructor(options) {
    super();
    var that = this;
    this.actionClient = options.actionClient;
    this.goalMessage = options.goalMessage;
    this.isFinished = false;
    this.status = undefined;
    this.result = undefined;
    this.feedback = undefined;

    // Used to create random IDs
    var date = new Date();

    // Create a random ID
    this.goalID = 'goal_' + Math.random() + '_' + date.getTime();
    // Fill in the goal message
    this.goalMessage = {
      goal_id: {
        stamp: {
          secs: 0,
          nsecs: 0
        },
        id: this.goalID
      },
      goal: this.goalMessage
    };

    this.on('status', function (status) {
      that.status = status;
    });

    this.on('result', function (result) {
      that.isFinished = true;
      that.result = result;
    });

    this.on('feedback', function (feedback) {
      that.feedback = feedback;
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
    var that = this;
    that.actionClient.goalTopic.publish(that.goalMessage);
    if (timeout) {
      setTimeout(function () {
        if (!that.isFinished) {
          that.emit('timeout');
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
