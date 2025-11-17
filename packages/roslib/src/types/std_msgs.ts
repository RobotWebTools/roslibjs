export namespace std_msgs {
  // rosbridge fills this in with defaults if you leave them unspecified, which is common in roslibjs code, so we artificially make it a Partial
  export type ROS1Header = Partial<{
    seq: number;
    stamp: time;
    frame_id: string;
  }>;
  // This is ROS 1 time. It is rectified to ROS 2 time by rosbridge_suite in-transit. We'll switch this to ROS 2 time when we drop ROS 1 support.
  export interface time {
    secs: number;
    nsecs: number;
  }
}
