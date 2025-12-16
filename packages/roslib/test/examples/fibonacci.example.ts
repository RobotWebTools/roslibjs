import { describe, it, expect } from "vitest";
import * as ROSLIB from "../../src/RosLib.ts";

const fibonacciItems = [
  { sequence: [0, 1, 1] },
  { sequence: [0, 1, 1, 2] },
  { sequence: [0, 1, 1, 2, 3] },
  { sequence: [0, 1, 1, 2, 3, 5] },
  { sequence: [0, 1, 1, 2, 3, 5, 8] },
  { sequence: [0, 1, 1, 2, 3, 5, 8, 13] },
  { sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21] },
];

describe("Fibonacci Example", function () {
  // Noetic is the only version of ROS 1 we support, so we skip based on distro name
  // instead of adding extra plumbing for ROS_VERSION.
  it.skipIf(process.env["ROS_DISTRO"] !== "noetic")(
    "Fibonacci ROS 1",
    () =>
      new Promise<void>((done) => {
        const ros = new ROSLIB.Ros({
          url: "ws://localhost:9090",
        });
        /*
         * The ActionClient
         * ----------------
         */

        const fibonacciClient = new ROSLIB.ActionClient({
          ros: ros,
          serverName: "/fibonacci",
          actionName: "actionlib_tutorials/FibonacciAction",
        });

        // Create a goal.
        const goal = new ROSLIB.Goal({
          actionClient: fibonacciClient,
          goalMessage: {
            order: 7,
          },
        });

        goal.on("feedback", function (feedback) {
          expect(feedback).to.eql(fibonacciItems.shift());
        });
        goal.on("result", function (result) {
          expect(result).to.eql({ sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21] });
          done();
        });

        /*
         * Send the goal to the action server.
         * The timeout is to allow rosbridge to properly subscribe all the
         * Action topics - otherwise, the first feedback message might get lost
         */
        setTimeout(function () {
          goal.send();
        }, 100);
      }),
    8000,
  );

  it.skipIf(process.env["ROS_DISTRO"] !== "humble")(
    "Fibonacci ROS 2",
    () =>
      new Promise<void>((done) => {
        const ros = new ROSLIB.Ros({
          url: "ws://localhost:9090",
        });
        /*
         * The Action
         * ----------------
         */

        const fibonacciAction = new ROSLIB.Action({
          ros,
          name: "/fibonacci",
          actionType: "action_tutorials_interfaces/action/Fibonacci",
        });

        const goal = { order: 8 };

        /*
         * Send the goal to the action server.
         */
        fibonacciAction.sendGoal(
          goal,
          (result) => {
            expect(result).to.eql({
              sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21],
            });
            done();
          },
          (feedback) => {
            expect(feedback).to.eql(fibonacciItems.shift());
          },
        );
      }),
    8000,
  );

  it.skipIf(process.env["ROS_DISTRO"] !== "humble")(
    "Fibonacci ROS 2, cancel all goals",
    async () => {
      const ros = new ROSLIB.Ros();
      await ros.connect("ws://localhost:9090");

      let resultCalled = false;
      let failedCalled = false;

      /*
       * The Action
       * ----------------
       */
      const fibonacciAction = new ROSLIB.Action({
        ros,
        name: "/fibonacci",
        actionType: "action_tutorials_interfaces/action/Fibonacci",
      });

      const goal = { order: 8 };

      /*
       * Send the goal to the action server.
       */
      fibonacciAction.sendGoal(
        goal,
        // result callback.
        () => {
          resultCalled = true;
        },
        // feedback callback.
        undefined,
        // failed callback
        () => {
          failedCalled = true;
        },
      );

      /*
       * Cancel all goals.
       */
      fibonacciAction.cancelAllGoals();

      setTimeout(() => {
        expect(failedCalled).toBe(true);
        expect(resultCalled).toBe(false);
      }, 500); // wait 500ms to be sure the server handled the cancel request.
    },
  );
});
