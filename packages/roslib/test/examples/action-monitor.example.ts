import { describe, expect, it } from "vitest";
import {
  Action,
  GoalStatus,
  Ros,
  type ActionFeedbackMessage,
  type action_msgs,
} from "../../src/RosLib.ts";
import { isRosbridgeStatusMessage } from "../../src/types/protocol.ts";

// This uses the real ROS 2 backend, including generated feedback message types
// and DDS's transient-local status delivery. Noetic only supplies ROS 1.
describe.skipIf(process.env["ROS_DISTRO"] === "noetic")(
  "ROS 2 action monitoring",
  () => {
    it("observes another client's feedback and an existing goal's status", async () => {
      const [serverRos, actorRos, observerRos, lateRos] = [
        new Ros(),
        new Ros(),
        new Ros(),
        new Ros(),
      ] as const;
      const clients = [serverRos, actorRos, observerRos, lateRos];
      const errors: string[] = [];
      for (const ros of [observerRos, lateRos]) {
        ros.on("status", (message) => {
          if (isRosbridgeStatusMessage(message) && message.level === "error")
            errors.push(message.msg);
        });
      }
      const options = {
        name: "/roslibjs_action_monitor_test",
        actionType: "action_tutorials_interfaces/action/Fibonacci",
      };
      const server = new Action<
        { order: number },
        { sequence: number[] },
        { sequence: number[] }
      >({ ros: serverRos, ...options });
      const actor = new Action({ ros: actorRos, ...options });
      const feedbackTopic = new Action<unknown, { sequence: number[] }>({
        ros: observerRos,
        ...options,
      }).getFeedbackTopic();
      const statusTopic = new Action({
        ros: lateRos,
        ...options,
      }).getStatusTopic();
      let feedback: ActionFeedbackMessage<{ sequence: number[] }> | undefined;
      let statuses: action_msgs.GoalStatusArray | undefined;
      const onFeedback = (message: typeof feedback) => {
        feedback = message;
      };
      const onStatus = (message: action_msgs.GoalStatusArray) => {
        statuses = message;
      };
      let goalRequestId: string | undefined;
      try {
        await Promise.all(
          clients.slice(0, 3).map(async (ros) => {
            const connected = new Promise<void>((resolve) => {
              ros.once("connection", () => {
                resolve();
              });
            });
            await ros.connect("ws://localhost:9090");
            await connected;
          }),
        );
        server.advertise(
          (_goal, id) => {
            goalRequestId = id;
          },
          () => {},
        );
        await expect
          .poll(
            () =>
              new Promise<string[]>((resolve, reject) => {
                serverRos.getActionServers(resolve, (error) => {
                  reject(new Error(error));
                });
              }),
            { timeout: 5000 },
          )
          .toContain(options.name);
        feedbackTopic.subscribe(onFeedback);
        const result = new Promise<unknown>((resolve, reject) => {
          actor.sendGoal({ order: 3 }, resolve, undefined, (error) => {
            reject(new Error(error));
          });
        });
        await expect.poll(() => goalRequestId, { timeout: 5000 }).toBeDefined();
        await expect
          .poll(
            () => {
              if (goalRequestId)
                server.sendFeedback(goalRequestId, { sequence: [0, 1, 1, 2] });
              return { feedback: feedback?.feedback, errors };
            },
            { timeout: 5000 },
          )
          .toEqual({ feedback: { sequence: [0, 1, 1, 2] }, errors: [] });

        // No status subscriber existed when the goal started.
        await lateRos.connect("ws://localhost:9090");
        statusTopic.subscribe(onStatus);
        await expect
          .poll(() => statuses?.status_list[0]?.status, { timeout: 5000 })
          .toBe(GoalStatus.STATUS_EXECUTING);
        expect(statuses?.status_list[0]?.goal_info.goal_id).toEqual(
          feedback?.goal_id,
        );
        expect(typeof statuses?.status_list[0]?.goal_info.stamp.sec).toBe(
          "number",
        );
        expect(typeof statuses?.status_list[0]?.goal_info.stamp.nanosec).toBe(
          "number",
        );
        if (!goalRequestId) throw new Error("Missing goal request ID");
        server.setSucceeded(goalRequestId, { sequence: [0, 1, 1, 2] });
        await expect(result).resolves.toEqual({ sequence: [0, 1, 1, 2] });
        await expect
          .poll(() => statuses?.status_list[0]?.status, { timeout: 5000 })
          .toBe(GoalStatus.STATUS_SUCCEEDED);
      } finally {
        feedbackTopic.unsubscribe(onFeedback);
        statusTopic.unsubscribe(onStatus);
        server.unadvertise();
        clients.forEach((ros) => {
          ros.close();
        });
      }
    }, 15000);
  },
);
