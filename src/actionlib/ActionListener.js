/**
 * @fileOverview
 * @author Justin Young - justin@oodar.com.au
 * @author Russell Toris - rctoris@wpi.edu
 */

import Topic from '../core/Topic.js';
import Ros from '../core/Ros.js';
import { EventEmitter } from 'eventemitter3';

/**
 * An actionlib action listener.
 *
 * Emits the following events:
 *  * 'status' - The status messages received from the action server.
 *  * 'feedback' - The feedback messages received from the action server.
 *  * 'result' - The result returned from the action server.
 *

 */
export default class ActionListener extends EventEmitter {
  /**
   * @param {Object} options
   * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} options.serverName - The action server name, like '/fibonacci'.
   * @param {string} options.actionName - The action message name, like 'actionlib_tutorials/FibonacciAction'.
   */
  constructor(options) {
    super();
    this.ros = options.ros;
    this.serverName = options.serverName;
    this.actionName = options.actionName;

    // create the topics associated with actionlib
    var goalListener = new Topic({
      ros: this.ros,
      name: this.serverName + '/goal',
      messageType: this.actionName + 'Goal'
    });

    var feedbackListener = new Topic({
      ros: this.ros,
      name: this.serverName + '/feedback',
      messageType: this.actionName + 'Feedback'
    });

    var statusListener = new Topic({
      ros: this.ros,
      name: this.serverName + '/status',
      messageType: 'actionlib_msgs/GoalStatusArray'
    });

    var resultListener = new Topic({
      ros: this.ros,
      name: this.serverName + '/result',
      messageType: this.actionName + 'Result'
    });

    goalListener.subscribe((goalMessage) => {
      this.emit('goal', goalMessage);
    });

    statusListener.subscribe((statusMessage) => {
      statusMessage.status_list.forEach((status) => {
        this.emit('status', status);
      });
    });

    feedbackListener.subscribe((feedbackMessage) => {
      this.emit('status', feedbackMessage.status);
      this.emit('feedback', feedbackMessage.feedback);
    });

    // subscribe to the result topic
    resultListener.subscribe((resultMessage) => {
      this.emit('status', resultMessage.status);
      this.emit('result', resultMessage.result);
    });
  }
}
