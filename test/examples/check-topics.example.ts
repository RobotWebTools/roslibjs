import { describe, it, expect, vi } from "vitest";
import * as ROSLIB from "../../src/RosLib.js";

const expectedTopics = ["/listener"];

describe("Example topics are live", function () {
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });

  it("getTopics", async () => {
    const callback = vi.fn();
    ros.getTopics(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledOnce();
      for (const topic of expectedTopics) {
        expect(callback.mock.calls[0][0].topics).to.contain(topic);
      }
    });
  });

  const example = ros.Topic({
    name: "/some_test_topic",
    messageType: "std_msgs/String",
  });

  it("doesn't automatically advertise the topic", async () => {
    const callback = vi.fn();
    ros.getTopics(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledOnce();
      expect(callback.mock.calls[0][0].topics).not.to.contain(
        "/some_test_topic",
      );
    });
    example.advertise();
  });

  it("advertise broadcasts the topic", async () => {
    const callback = vi.fn();
    ros.getTopics(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledOnce();
      expect(callback.mock.calls[0][0].topics).to.contain("/some_test_topic");
    });
    example.unadvertise();
  });

  it("unadvertise will end the topic (if it's the last around)", async () => {
    const callback = vi.fn();
    ros.getTopics(callback);
    vi.waitFor(function () {
      expect(callback).toHaveBeenCalledOnce();
      expect(callback.mock.calls[0][0]).not.to.contain("/some_test_topic");
    }, 15000);
  });
});
