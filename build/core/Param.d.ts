export = Param;
/**
 * A ROS parameter.
 */
declare class Param {
    /**
     * @param {Object} options
     * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
     * @param {string} options.name - The param name, like max_vel_x.
     */
    constructor(options: {
        ros: Ros;
        name: string;
    });
    ros: Ros;
    name: string;
    /**
     * @callback getCallback
     * @param {Object} value - The value of the param from ROS.
     */
    /**
     * Fetch the value of the param.
     *
     * @param {getCallback} callback - Function with the following params:
     */
    get(callback: (value: any) => any): void;
    /**
     * @callback setParamCallback
     * @param {Object} response - The response from the service request.
     */
    /**
     * @callback setParamFailedCallback
     * @param {Object} response - The response from the service request.
     */
    /**
     * Set the value of the param in ROS.
     *
     * @param {Object} value - The value to set param to.
     * @param {setParamCallback} callback - The callback function.
     */
    set(value: any, callback: (response: any) => any): void;
    /**
     * Delete this parameter on the ROS server.
     *
     * @param {setParamCallback} callback - The callback function.
     */
    delete(callback: (response: any) => any): void;
}
import Ros = require("../core/Ros");
