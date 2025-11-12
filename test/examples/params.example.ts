import { describe, it, expect, vi } from "vitest";
import * as ROSLIB from "../../src/RosLib.ts";

const PARAM_NAME =
  process.env["ROS_DISTRO"] === "noetic"
    ? "/test/foo"
    : // Is it crazy to muck around with use_sim_time here? I feel like it shouldn't matter..
      "/add_two_ints_server:use_sim_time";

describe("Param setting", function () {
  const ros = new ROSLIB.Ros({
    url: "ws://localhost:9090",
  });
  const param = ros.Param<boolean>({
    name: PARAM_NAME,
  });

  it("Param generics", function () {
    expect(param).to.be.instanceOf(ROSLIB.Param);
    expect(param.name).to.be.equal(PARAM_NAME);
  });

  it("Param.set no callback", () => {
    param.set(true);
  });

  it("Param.get", { retry: 3 }, async () => {
    const callback = vi.fn();
    param.get(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  it("Param.set w/ callback", async () => {
    const callback = vi.fn();
    param.set(false, callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
  });

  it("Param.get", async () => {
    const callback = vi.fn();
    param.get(callback);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  // Known issue with getting params being able to hang in Humble because it had no timeout.
  // This doesn't even work with `ros2 param list` at the CLI in our test environment :(
  it.skipIf(process.env["ROS_DISTRO"] === "humble")(
    "ros.getParams",
    async () => {
      const callback = vi.fn();
      ros.getParams(callback);
      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalledOnce();
        expect(callback.mock.calls[0]?.[0]).to.include(PARAM_NAME);
      });
    },
  );

  // In ROS 2 we can't forcibly un-declare someone else's parameter
  it.skipIf(process.env["ROS_DISTRO"] !== "noetic")(
    "Param.delete",
    async () => {
      const callback = vi.fn();
      param.delete(callback);
      await vi.waitFor(() => {
        expect(callback).toHaveBeenCalled();
      });
      const getParamsCallback = vi.fn();
      ros.getParams(getParamsCallback);
      await vi.waitFor(() =>
        expect(getParamsCallback.mock.calls[0]?.[0]).to.not.include(PARAM_NAME),
      );
    },
  );
});
