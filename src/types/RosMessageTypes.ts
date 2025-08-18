/**
 * @fileOverview Useful message implementations built into ROS2, needed for comprehensive typing.
 * @author Andrew Hoener
 */

// region Actions & ActionLib

/**
 * Represents the status of an action goal
 * This is directly based on the action_msgs/GoalStatus ROS message:
 * https://docs.ros2.org/latest/api/action_msgs/msg/GoalStatus.html
 */
export enum GoalStatus {
  /**
   * Indicates status has not been properly set.
   */
  Unknown = 0,
  /**
   * The goal has been accepted and is awaiting execution.
   */
  Accepted = 1,
  /**
   * The goal is currently being executed by the action server.
   */
  Executing = 2,
  /**
   * The client has requested that the goal be canceled and the action server has
   * accepted the cancel request.
   */
  Canceling = 3,
  /**
   * The goal was achieved successfully by the action server.
   */
  Succeeded = 4,
  /**
   * The goal was canceled after an external request from an action client.
   */
  Canceled = 5,
  /**
   * The goal was terminated by the action server without an external request.
   */
  Aborted = 6,
}

// endregion
