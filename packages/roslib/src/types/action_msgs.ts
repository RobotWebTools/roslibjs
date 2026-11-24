import type { GoalStatus as GoalStatusCode } from "../core/GoalStatus.ts";
import type { builtin_interfaces } from "./builtin_interfaces.ts";
import type { unique_identifier_msgs } from "./unique_identifier_msgs.ts";

/** ROS 2 action topic messages, distinct from ROS 1 actionlib messages. */
export namespace action_msgs {
  export interface GoalInfo {
    goal_id: unique_identifier_msgs.UUID;
    stamp: builtin_interfaces.Time;
  }

  export interface GoalStatus {
    goal_info: GoalInfo;
    status: GoalStatusCode;
  }

  export interface GoalStatusArray {
    status_list: GoalStatus[];
  }
}
