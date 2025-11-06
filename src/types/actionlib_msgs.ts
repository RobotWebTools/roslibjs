import { std_msgs } from "./std_msgs.js";
import { GoalStatus as GoalStatusEnum } from "../core/GoalStatus.js";

export namespace actionlib_msgs {
  export interface GoalID {
    id: string;
    stamp: { sec: number; nsec: number };
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
