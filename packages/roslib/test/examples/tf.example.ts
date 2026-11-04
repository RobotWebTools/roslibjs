import { describe, it, expect, afterAll } from "vitest";
import * as ROSLIB from "../../src/RosLib.ts";

// Noetic is the only version of ROS 1 we support, so we skip based on distro name
// instead of adding extra plumbing for ROS_VERSION.
describe.skipIf(process.env["ROS_DISTRO"] !== "noetic")(
  "ROS 1 TF2 Republisher Example",
  function () {
    it("tf republisher", () =>
      new Promise<void>((done) => {
        const ros = new ROSLIB.Ros({
          url: "ws://localhost:9090",
        });

        const tfClient = new ROSLIB.TFClient({
          ros: ros,
          fixedFrame: "world",
          angularThres: 0.01,
          transThres: 0.01,
        });

        // Subscribe to a turtle.
        tfClient.subscribe("turtle1", function (tf) {
          expect(tf.rotation).to.be.eql(new ROSLIB.Quaternion());
          expect(tf.translation).to.be.a.instanceof(ROSLIB.Vector3);
          done();
        });
      }));

    it("tf republisher alternative syntax", () =>
      new Promise<void>((done) => {
        const ros = new ROSLIB.Ros({
          url: "ws://localhost:9090",
        });

        const tfClient = ros.TFClient({
          fixedFrame: "world",
          angularThres: 0.01,
          transThres: 0.01,
        });

        // Subscribe to a turtle.
        tfClient.subscribe("turtle1", function (tf) {
          expect(tf.rotation).to.be.eql(new ROSLIB.Quaternion());
          expect(tf.translation).to.be.a.instanceof(ROSLIB.Vector3);
          done();
        });
      }));
  },
);

// ROS 2 tf2_web_republisher serves an action, which only ROS2TFClient speaks.
// The launch file publishes a static identity transform world -> turtle1.
describe.skipIf(process.env["ROS_DISTRO"] === "noetic")(
  "ROS 2 TF2 Republisher Example",
  function () {
    const ros = new ROSLIB.Ros({
      url: "ws://localhost:9090",
    });
    const clients: ROSLIB.ROS2TFClient[] = [];

    it("tf republisher", () =>
      new Promise<void>((done) => {
        const tfClient = new ROSLIB.ROS2TFClient({
          ros: ros,
          fixedFrame: "world",
          angularThres: 0.01,
          transThres: 0.01,
        });
        clients.push(tfClient);

        tfClient.subscribe("turtle1", function (tf) {
          expect(tf.rotation).to.be.eql(new ROSLIB.Quaternion());
          expect(tf.translation).to.be.eql(new ROSLIB.Vector3());
          done();
        });
      }));

    afterAll(function () {
      for (const client of clients) {
        client.dispose();
      }
      ros.close();
    });
  },
);
