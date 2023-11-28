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
     * @callback getFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Fetch the value of the param.
     *
     * @param {getCallback} callback - The callback function.
     * @param {getFailedCallback} [failedCallback] - The callback function when the service call failed.
     */
    get(callback: (value: any) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback setParamCallback
     * @param {Object} response - The response from the service request.
     */
    /**
     * @callback setParamFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Set the value of the param in ROS.
     *
     * @param {Object} value - The value to set param to.
     * @param {setParamCallback} [callback] - The callback function.
     * @param {setParamFailedCallback} [failedCallback] - The callback function when the service call failed.
     */
    set(value: any, callback?: ((response: any) => any) | undefined, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * Delete this parameter on the ROS server.
     *
     * @param {setParamCallback} callback - The callback function.
     * @param {setParamFailedCallback} [failedCallback] - The callback function when the service call failed.
     */
    delete(callback: (response: any) => any, failedCallback?: ((error: string) => any) | undefined): void;
}
import Ros = require("../core/Ros");
