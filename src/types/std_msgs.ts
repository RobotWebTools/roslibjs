export namespace std_msgs {
  // rosbridge fills this in with defaults if you leave them unspecified, which is common in roslibjs code, so we artificially make it a Partial
  export type ROS1Header = Partial<{
    seq: number;
    stamp: { sec: number; nsec: number };
    frame_id: string;
  }>;
}
