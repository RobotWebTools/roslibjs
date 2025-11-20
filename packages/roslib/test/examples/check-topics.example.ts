import { describe, it, expect, vi } from "vitest";
import * as ROSLIB from "../../src/RosLib.ts";
import type { rosapi } from "../../src/types/rosapi.ts";

const expectedTopics = ["/listener"];

describe("Example topics are live", function () {
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  it("getTopics", async () => {
    const callback = vi.fn((res: rosapi.TopicsResponse) => {
      for (const topic of expectedTopics) {
        expect(res.topics).to.contain(topic);
      }
    });
    ros.getTopics(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  const example = ros.Topic({
    name: "/some_test_topic",
    messageType: "std_msgs/String",
  });

  it("doesn't automatically advertise the topic", async () => {
    const callback = vi.fn((res: rosapi.TopicsResponse) => {
      expect(res.topics).not.to.contain("/some_test_topic");
    });
    ros.getTopics(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledOnce();
    });
    example.advertise();
  });

  it("advertise broadcasts the topic", async () => {
    const callback = vi.fn((res: rosapi.TopicsResponse) => {
      expect(res.topics).to.contain("/some_test_topic");
    });
    ros.getTopics(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledOnce();
    });
    example.unadvertise();
  });

  it("unadvertise will end the topic (if it's the last around)", async () => {
    const callback = vi.fn<(res: rosapi.TopicsResponse) => void>();
    await vi.waitFor(function () {
      ros.getTopics(callback);
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls.at(-1)?.at(0)?.topics).not.to.contain(
        "/some_test_topic",
      );
    }, 15000);
  }, 15000);
});
