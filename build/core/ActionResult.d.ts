export = ActionResult;
/**
 * An ActionResult is returned from sending a ROS 2 action goal.
 *
 * @constructor
 * @template T
 */
declare class ActionResult<T> {
    /**
     * @param {T} [values={}] - Object matching the fields defined in the .action definition file.
     */
    constructor(values?: T | undefined);
}
