export namespace geometry_msgs {
  export interface TransformStamped {
    // TODO: some sort of unholy union type of ros1 header and ros2 header???
    child_frame_id: string;
    transform: Transform;
  }
  export interface Transform {
    translation: Vector3;
    rotation: Quaternion;
  }
  export interface Vector3 {
    x: number;
    y: number;
    z: number;
  }
  export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
  }
}
