export = ActionFeedback;
/**
 * An ActionFeedback is periodically returned during an in-progress ROS 2 action.
 *
 * @constructor
 * @template T
 */
declare class ActionFeedback<T> {
    /**
     * @param {T} [values={}] - Object matching the fields defined in the .action definition file.
     */
    constructor(values?: T | undefined);
}
