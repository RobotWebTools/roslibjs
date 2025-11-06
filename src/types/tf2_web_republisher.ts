import { geometry_msgs } from "./geometry_msgs";

export namespace tf2_web_republisher {
  export interface RepublishTFsRequest extends TFSubscriptionGoal {
    timeout: {
      sec: number;
      nsec: number;
    };
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

  export type TFSubscriptionResult = Record<never, never>;

  export interface TFSubscriptionFeedback {
    transforms: geometry_msgs.TransformStamped[];
  }
}
