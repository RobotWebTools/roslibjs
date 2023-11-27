export = ActionListener;
/**
 * An actionlib action listener.
 *
 * Emits the following events:
 *  * 'status' - The status messages received from the action server.
 *  * 'feedback' - The feedback messages received from the action server.
 *  * 'result' - The result returned from the action server.
 *

 */
declare class ActionListener extends EventEmitter2 {
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
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import Ros = require("../core/Ros");
