import type { geometry_msgs } from "./geometry_msgs.ts";
import type { std_msgs } from "./std_msgs.ts";

export namespace tf2_web_republisher {
  type EmptyObject = Record<string, never>;

  export interface RepublishTFsRequest extends TFSubscriptionGoal {
    timeout: std_msgs.time;
  }

  export interface RepublishTFsResponse {
    topic_name: string;
  }

  export interface TFSubscriptionGoal {
    source_frames: string[];
    target_frame: string;
    angular_thres: number;
    trans_thres: number;
    rate: number;
  }

  export type TFSubscriptionResult = EmptyObject;

  export interface TFSubscriptionFeedback {
    transforms: geometry_msgs.TransformStamped[];
  }
}
