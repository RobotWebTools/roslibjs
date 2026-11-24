import { once } from "node:events";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocketServer, type WebSocket } from "ws";
import Action from "../src/core/Action.ts";
import { GoalStatus } from "../src/core/GoalStatus.ts";
import Ros from "../src/core/Ros.ts";
import type { action_msgs } from "../src/types/action_msgs.ts";
import {
  isRosbridgeSendActionGoalMessage,
  isRosbridgeSubscribeMessage,
  isRosbridgeUnsubscribeMessage,
  isRosbridgeMessage,
  type RosbridgeMessageBase,
  type RosbridgeSubscribeMessage,
} from "../src/types/protocol.ts";

// This fixture speaks rosbridge over real WebSockets; it does not emulate DDS.
describe("action topic WebSocket traffic", () => {
  let server: WebSocketServer;
  let url: string;
  let subscriptions: Map<WebSocket, Map<string, RosbridgeSubscribeMessage>>;
  let traffic: RosbridgeMessageBase[];
  let statuses: action_msgs.GoalStatusArray;
  let clients: Ros[];
  let cleanups: (() => void)[];

  function publish(topic: string, msg: unknown) {
    for (const [socket, topics] of subscriptions) {
      if (topics.has(topic))
        socket.send(JSON.stringify({ op: "publish", topic, msg }));
    }
  }

  async function connect(ros = new Ros()) {
    if (!clients.includes(ros)) clients.push(ros);
    const connected = new Promise<void>((resolve) => {
      ros.once("connection", () => {
        resolve();
      });
    });
    await ros.connect(url);
    await connected;
    return ros;
  }

  beforeEach(async () => {
    subscriptions = new Map();
    traffic = [];
    statuses = { status_list: [] };
    clients = [];
    cleanups = [];
    server = new WebSocketServer({ host: "127.0.0.1", port: 0 });
    await once(server, "listening");
    const address = server.address();
    if (typeof address !== "object" || !address)
      throw new Error("Missing server port");
    url = `ws://127.0.0.1:${address.port.toString()}`;
    server.on("connection", (socket) => {
      const topics = new Map<string, RosbridgeSubscribeMessage>();
      subscriptions.set(socket, topics);
      socket.on("close", () => subscriptions.delete(socket));
      socket.on("message", (data) => {
        const buffer = Array.isArray(data)
          ? Buffer.concat(data)
          : Buffer.isBuffer(data)
            ? data
            : Buffer.from(data);
        const message: unknown = JSON.parse(buffer.toString("utf8"));
        if (!isRosbridgeMessage(message))
          throw new Error("Invalid rosbridge message");
        traffic.push(message);
        if (isRosbridgeSubscribeMessage(message)) {
          topics.set(message.topic, message);
          if (
            message.topic.endsWith("/_action/status") &&
            message.qos?.durability === "transient_local"
          ) {
            socket.send(
              JSON.stringify({
                op: "publish",
                topic: message.topic,
                msg: statuses,
              }),
            );
          }
        } else if (isRosbridgeUnsubscribeMessage(message)) {
          topics.delete(message.topic);
        } else if (isRosbridgeSendActionGoalMessage(message)) {
          const goal_id = { uuid: Buffer.alloc(16, 42).toString("base64") };
          statuses = {
            status_list: [
              {
                goal_info: { goal_id, stamp: { sec: 10, nanosec: 20 } },
                status: GoalStatus.STATUS_EXECUTING,
              },
            ],
          };
          publish(`${message.action}/_action/status`, statuses);
          publish(`${message.action}/_action/feedback`, {
            goal_id,
            feedback: { sequence: [0, 1, 1, 2] },
          });
        }
      });
    });
  });

  afterEach(async () => {
    cleanups.forEach((cleanup) => {
      cleanup();
    });
    clients.forEach((client) => {
      client.close();
    });
    server.clients.forEach((socket) => {
      socket.terminate();
    });
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  it("observes another connection's goal and resumes monitoring after reconnect", async () => {
    const observer = await connect();
    const actor = await connect();
    const action = new Action<unknown, { sequence: number[] }>({
      ros: observer,
      name: "/robot/fibonacci",
      actionType: "example_interfaces/action/Fibonacci",
    });
    const status = action.getStatusTopic();
    const feedback = action.getFeedbackTopic();
    const seenStatuses: action_msgs.GoalStatusArray[] = [];
    const seenFeedback: { sequence: number[] }[] = [];
    const onStatus = (message: action_msgs.GoalStatusArray) =>
      seenStatuses.push(message);
    const onFeedback: Parameters<typeof feedback.subscribe>[0] = (message) =>
      seenFeedback.push(message.feedback);
    status.subscribe(onStatus);
    feedback.subscribe(onFeedback);
    cleanups.push(
      () => {
        status.unsubscribe(onStatus);
      },
      () => {
        feedback.unsubscribe(onFeedback);
      },
    );
    await expect
      .poll(
        () => traffic.filter((message) => message.op === "subscribe").length,
      )
      .toBe(2);
    new Action({
      ros: actor,
      name: "/robot/fibonacci",
      actionType: "example_interfaces/action/Fibonacci",
    }).sendGoal({ order: 5 }, () => {});
    await expect.poll(() => seenFeedback).toEqual([{ sequence: [0, 1, 1, 2] }]);
    expect(seenStatuses.at(-1)?.status_list[0]?.status).toBe(
      GoalStatus.STATUS_EXECUTING,
    );

    const closed = new Promise<void>((resolve) => {
      observer.once("close", () => {
        resolve();
      });
    });
    observer.close();
    await closed;
    await connect(observer);
    await expect
      .poll(
        () => traffic.filter((message) => message.op === "subscribe").length,
      )
      .toBe(4);
    publish(feedback.name, {
      goal_id: { uuid: Buffer.alloc(16, 43).toString("base64") },
      feedback: { sequence: [3, 5] },
    });
    await expect.poll(() => seenFeedback).toHaveLength(2);
    expect(seenFeedback[1]).toEqual({ sequence: [3, 5] });

    status.unsubscribe(onStatus);
    feedback.unsubscribe(onFeedback);
    await expect
      .poll(() =>
        [...subscriptions.values()].reduce(
          (count, topics) => count + topics.size,
          0,
        ),
      )
      .toBe(0);
    expect(observer.listenerCount(status.name)).toBe(0);
    expect(observer.listenerCount(feedback.name)).toBe(0);
  });

  it("receives the last status when joining after another client started the goal", async () => {
    const actor = await connect();
    new Action({
      ros: actor,
      name: "/robot/fibonacci",
      actionType: "example_interfaces/Fibonacci",
    }).sendGoal({ order: 5 }, () => {});
    await expect.poll(() => statuses.status_list).toHaveLength(1);
    const observer = await connect();
    const topic = new Action({
      ros: observer,
      name: "/robot/fibonacci",
      actionType: "example_interfaces/Fibonacci",
    }).getStatusTopic();
    let received: action_msgs.GoalStatusArray | undefined;
    const onStatus = (message: action_msgs.GoalStatusArray) => {
      received = message;
    };
    topic.subscribe(onStatus);
    cleanups.push(() => {
      topic.unsubscribe(onStatus);
    });
    await expect
      .poll(() => received?.status_list[0]?.status)
      .toBe(GoalStatus.STATUS_EXECUTING);
    expect(received?.status_list[0]?.goal_info.goal_id.uuid).toEqual(
      Buffer.alloc(16, 42).toString("base64"),
    );
    expect(
      traffic.filter((message) => message.op === "send_action_goal"),
    ).toHaveLength(1);
  });
});
