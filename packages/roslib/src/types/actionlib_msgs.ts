import type { std_msgs } from "./std_msgs.ts";

export namespace actionlib_msgs {
  export interface GoalID {
    id: string;
    stamp: std_msgs.time;
  }
  export interface GoalStatus {
    goal_id: GoalID;
    /**
     * ROS 1 actionlib status code (PENDING=0, ACTIVE=1, PREEMPTED=2, SUCCEEDED=3,
     * ABORTED=4, REJECTED=5, PREEMPTING=6, RECALLING=7, RECALLED=8, LOST=9).
     * Not to be confused with the ROS 2 `GoalStatus` enum.
     */
    status: number;
    text?: string;
  }
  export interface GoalStatusArray {
    header: std_msgs.ROS1Header;
    status_list: GoalStatus[];
  }
}
