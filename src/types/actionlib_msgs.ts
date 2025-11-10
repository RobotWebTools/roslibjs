import type { std_msgs } from "./std_msgs.js";
import type { GoalStatus as GoalStatusEnum } from "../core/GoalStatus.js";

export namespace actionlib_msgs {
  export interface GoalID {
    id: string;
    stamp: std_msgs.time;
  }
  export interface GoalStatus {
    goal_id: GoalID;
    status: GoalStatusEnum;
    text?: string;
  }
  export interface GoalStatusArray {
    header: std_msgs.ROS1Header;
    status_list: GoalStatus[];
  }
}
