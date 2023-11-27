export = SimpleActionServer;
/**
 * An actionlib action server client.
 *
 * Emits the following events:
 *  * 'goal' - Goal sent by action client.
 *  * 'cancel' - Action client has canceled the request.
 */
declare class SimpleActionServer extends EventEmitter2 {
    /**
     * @param {Object} options
     * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
     * @param {string} options.serverName - The action server name, like '/fibonacci'.
     * @param {string} options.actionName - The action message name, like 'actionlib_tutorials/FibonacciAction'.
     */
    constructor(options: {
        ros: Ros;
        serverName: string;
        actionName: string;
    });
    ros: Ros;
    serverName: string;
    actionName: string;
    feedbackPublisher: Topic;
    resultPublisher: Topic;
    statusMessage: Message;
    currentGoal: any;
    nextGoal: any;
    /**
     * Set action state to succeeded and return to client.
     *
     * @param {Object} result - The result to return to the client.
     */
    setSucceeded(result: any): void;
    /**
     * Set action state to aborted and return to client.
     *
     * @param {Object} result - The result to return to the client.
     */
    setAborted(result: any): void;
    /**
     * Send a feedback message.
     *
     * @param {Object} feedback - The feedback to send to the client.
     */
    sendFeedback(feedback: any): void;
    /**
     * Handle case where client requests preemption.
     */
    setPreempted(): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import Ros = require("../core/Ros");
import Topic = require("../core/Topic");
import Message = require("../core/Message");
