export = Goal;
/**
 * An actionlib goal that is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - If a timeout occurred while sending a goal.
 */
declare class Goal extends EventEmitter2 {
    /**
     * @param {Object} options
     * @param {ActionClient} options.actionClient - The ROSLIB.ActionClient to use with this goal.
     * @param {Object} options.goalMessage - The JSON object containing the goal for the action server.
     */
    constructor(options: {
        actionClient: ActionClient;
        goalMessage: any;
    });
    actionClient: ActionClient;
    goalMessage: Message<{
        goal_id: {
            stamp: {
                secs: number;
                nsecs: number;
            };
            id: string;
        };
        goal: any;
    }>;
    isFinished: boolean;
    status: any;
    result: any;
    feedback: any;
    goalID: string;
    /**
     * Send the goal to the action server.
     *
     * @param {number} [timeout] - A timeout length for the goal's result.
     */
    send(timeout?: number | undefined): void;
    /**
     * Cancel the current goal.
     */
    cancel(): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import ActionClient = require("./ActionClient");
import Message = require("../core/Message");
