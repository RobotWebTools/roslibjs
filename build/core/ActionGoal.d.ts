export = ActionGoal;
/**
 * An ActionGoal is passed into a ROS 2 action goal request.
 *
 * @constructor
 * @template T
 */
declare class ActionGoal<T> {
    /**
     * @param {T} [values={}] - Object matching the fields defined in the .action definition file.
     */
    constructor(values?: T | undefined);
}
