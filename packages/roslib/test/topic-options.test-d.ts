import { describe, it } from "vitest";
import * as ROSLIB from "../src/RosLib.ts";

describe("Topic options types", () => {
  const ros = new ROSLIB.Ros();
  const base = { name: "/chatter", messageType: "std_msgs/msg/String" };

  it("accepts qos, legacy options, or neither", () => {
    new ROSLIB.Topic({ ros, ...base });
    new ROSLIB.Topic({ ros, ...base, qos: { depth: 1 } });
    new ROSLIB.Topic({ ros, ...base, latch: true, queue_size: 1 });
    ros.Topic({ ...base });
    ros.Topic({ ...base, qos: { depth: 1 } });
    ros.Topic({ ...base, latch: true, queue_size: 1 });
  });

  it("rejects qos combined with latch or queue_size", () => {
    // @ts-expect-error qos and latch are mutually exclusive
    new ROSLIB.Topic({ ros, ...base, qos: {}, latch: true });
    // @ts-expect-error qos and queue_size are mutually exclusive
    new ROSLIB.Topic({ ros, ...base, qos: {}, queue_size: 1 });
    // @ts-expect-error qos and latch are mutually exclusive
    ros.Topic({ ...base, qos: {}, latch: true });
    // @ts-expect-error qos and queue_size are mutually exclusive
    ros.Topic({ ...base, qos: {}, queue_size: 1 });
  });
});
