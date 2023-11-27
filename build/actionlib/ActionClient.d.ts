export = ActionClient;
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
declare class ActionClient extends EventEmitter2 {
    /**
     * @param {Object} options
     * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
     * @param {string} options.serverName - The action server name, like '/fibonacci'.
     * @param {string} options.actionName - The action message name, like 'actionlib_tutorials/FibonacciAction'.
     * @param {number} [options.timeout] - The timeout length when connecting to the action server.
     * @param {boolean} [options.omitFeedback] - The flag to indicate whether to omit the feedback channel or not.
     * @param {boolean} [options.omitStatus] - The flag to indicate whether to omit the status channel or not.
     * @param {boolean} [options.omitResult] - The flag to indicate whether to omit the result channel or not.
     */
    constructor(options: {
        ros: Ros;
        serverName: string;
        actionName: string;
        timeout?: number | undefined;
        omitFeedback?: boolean | undefined;
        omitStatus?: boolean | undefined;
        omitResult?: boolean | undefined;
    });
    ros: Ros;
    serverName: string;
    actionName: string;
    timeout: number | undefined;
    omitFeedback: boolean | undefined;
    omitStatus: boolean | undefined;
    omitResult: boolean | undefined;
    goals: {};
    feedbackListener: Topic;
    statusListener: Topic;
    resultListener: Topic;
    goalTopic: Topic;
    cancelTopic: Topic;
    /**
     * Cancel all goals associated with this ActionClient.
     */
    cancel(): void;
    /**
     * Unsubscribe and unadvertise all topics associated with this ActionClient.
     */
    dispose(): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import Ros = require("../core/Ros");
import Topic = require("../core/Topic");
