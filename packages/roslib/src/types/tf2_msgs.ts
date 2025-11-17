import type { geometry_msgs } from "./geometry_msgs.ts";

export namespace tf2_msgs {
  export interface TFMessage {
    transforms: geometry_msgs.TransformStamped[];
  }
}
