/**
 * An enumeration for goal statuses.
 * This is directly based on the action_msgs/GoalStatus ROS message:
 * https://docs.ros2.org/latest/api/action_msgs/msg/GoalStatus.html
 */
export enum GoalStatus {
    STATUS_UNKNOWN = 0,
    STATUS_ACCEPTED = 1,
    STATUS_EXECUTING = 2,
    STATUS_CANCELING = 3,
    STATUS_SUCCEEDED = 4,
    STATUS_CANCELED = 5,
    STATUS_ABORTED = 6
}
