import { EventEmitter } from "eventemitter3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Action, { type ActionFeedbackMessage } from "../src/core/Action.ts";
import { GoalStatus } from "../src/core/GoalStatus.ts";
import type Ros from "../src/core/Ros.ts";
import type { action_msgs } from "../src/types/action_msgs.ts";
import type { RosbridgeMessage } from "../src/types/protocol.ts";

describe("ROS 2 action topics", () => {
  let ros: Ros;
  let callOnConnection: ReturnType<
    typeof vi.fn<(message: RosbridgeMessage) => void>
  >;

  beforeEach(() => {
    callOnConnection = vi.fn<(message: RosbridgeMessage) => void>();
    ros = Object.assign(new EventEmitter(), {
      callOnConnection,
    }) as unknown as Ros;
  });

  const createAction = (
    actionType = "example_interfaces/action/Fibonacci",
    name = "/robot/fibonacci",
  ) => new Action<unknown, { sequence: number[] }>({ ros, name, actionType });

  function sent(op: string) {
    return callOnConnection.mock.calls
      .map(([message]) => message)
      .filter((message) => message.op === op);
  }

  it.each([
    "example_interfaces/Fibonacci",
    "example_interfaces/action/Fibonacci",
  ])("derives the complete feedback wrapper type from %s", (actionType) => {
    const topic = createAction(actionType).getFeedbackTopic();
    expect(topic.name).toBe("/robot/fibonacci/_action/feedback");
    expect(topic.messageType).toBe(
      "example_interfaces/action/Fibonacci_FeedbackMessage",
    );
    expect(callOnConnection).not.toHaveBeenCalled();
    topic.subscribe(() => {});
    expect(sent("subscribe")).toEqual([
      expect.objectContaining({
        type: topic.messageType,
        topic: topic.name,
        qos: {
          history: "keep_last",
          depth: 10,
          reliability: "reliable",
          durability: "volatile",
        },
      }),
    ]);
  });

  it("requests transient-local status so late observers can receive existing goals", () => {
    const topic = createAction().getStatusTopic();
    topic.subscribe(() => {});
    expect(sent("subscribe")).toEqual([
      expect.objectContaining({
        type: "action_msgs/msg/GoalStatusArray",
        topic: "/robot/fibonacci/_action/status",
        qos: {
          history: "keep_last",
          depth: 1,
          reliability: "reliable",
          durability: "transient_local",
        },
      }),
    ]);
    expect(sent("send_action_goal")).toHaveLength(0);
  });

  it.each(["/robot/fibonacci/", "/robot/fibonacci///", "relative/fibonacci"])(
    "preserves the action namespace without duplicate separators: %s",
    (name) => {
      const action = createAction(undefined, name);
      const prefix = name.replace(/\/+$/, "");
      expect(action.getFeedbackTopic().name).toBe(`${prefix}/_action/feedback`);
      expect(action.getStatusTopic().name).toBe(`${prefix}/_action/status`);
      expect(action.name).toBe(name);
    },
  );

  it.each([
    "",
    "Fibonacci",
    "pkg/msg/Fibonacci",
    "pkg/action/",
    "/pkg/action/Fibonacci",
    "pkg/action/Fibonacci/extra",
  ])(
    "rejects an action type that cannot identify its feedback message: %s",
    (type) => {
      expect(() => createAction(type).getFeedbackTopic()).toThrow(
        "Cannot derive feedback message type",
      );
      expect(callOnConnection).not.toHaveBeenCalled();
    },
  );

  it("merges per-topic QoS overrides without changing another topic's defaults", () => {
    const action = createAction();
    const feedback = action.getFeedbackTopic({
      qos: { reliability: "best_effort", depth: 4 },
      compression: "cbor",
      throttle_rate: 20,
      queue_length: 3,
      reconnect_on_close: false,
    });
    const status = action.getStatusTopic({
      qos: { durability: "volatile", depth: 7 },
    });
    feedback.subscribe(() => {});
    status.subscribe(() => {});
    expect(sent("subscribe")[0]).toMatchObject({
      compression: "cbor",
      throttle_rate: 20,
      queue_length: 3,
      qos: {
        history: "keep_last",
        depth: 4,
        reliability: "best_effort",
        durability: "volatile",
      },
    });
    expect(status.qos).toEqual({
      history: "keep_last",
      depth: 7,
      reliability: "reliable",
      durability: "volatile",
    });
    expect(action.getStatusTopic().qos).toMatchObject({
      depth: 1,
      durability: "transient_local",
    });
    expect(action.getFeedbackTopic().qos).toMatchObject({
      depth: 10,
      reliability: "reliable",
    });
    expect(feedback.reconnect_on_close).toBe(false);
  });

  it("delivers complete feedback and status for goals sent by other clients", () => {
    const action = createAction();
    const feedback = action.getFeedbackTopic();
    const status = action.getStatusTopic();
    const onFeedback =
      vi.fn<(message: ActionFeedbackMessage<{ sequence: number[] }>) => void>();
    const onStatus = vi.fn<(message: action_msgs.GoalStatusArray) => void>();
    feedback.subscribe(onFeedback);
    status.subscribe(onStatus);
    const goalA = { uuid: Array.from({ length: 16 }, () => 1) };
    const goalB = { uuid: Array.from({ length: 16 }, () => 2) };
    for (const goal_id of [goalA, goalB]) {
      ros.emit(feedback.name, {
        op: "publish",
        topic: feedback.name,
        msg: { goal_id, feedback: { sequence: [0, 1, 1] } },
      });
    }
    const message: action_msgs.GoalStatusArray = {
      status_list: [
        {
          goal_info: { goal_id: goalA, stamp: { sec: 42, nanosec: 10 } },
          status: GoalStatus.STATUS_EXECUTING,
        },
        {
          goal_info: { goal_id: goalB, stamp: { sec: 43, nanosec: 20 } },
          status: GoalStatus.STATUS_SUCCEEDED,
        },
      ],
    };
    ros.emit(status.name, { op: "publish", topic: status.name, msg: message });
    expect(onFeedback.mock.calls.map(([message]) => message)).toEqual([
      { goal_id: goalA, feedback: { sequence: [0, 1, 1] } },
      { goal_id: goalB, feedback: { sequence: [0, 1, 1] } },
    ]);
    expect(onStatus).toHaveBeenCalledWith(message);
    expect(sent("send_action_goal")).toHaveLength(0);
    feedback.unsubscribe(onFeedback);
    status.unsubscribe(onStatus);
  });

  it("allows independent observers to unsubscribe without affecting each other", () => {
    const action = createAction();
    const first = action.getStatusTopic();
    const second = action.getStatusTopic();
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    first.subscribe(firstCallback);
    second.subscribe(secondCallback);
    expect(first).not.toBe(second);
    expect(sent("subscribe")).toHaveLength(2);
    first.unsubscribe(firstCallback);
    ros.emit(second.name, {
      op: "publish",
      topic: second.name,
      msg: { status_list: [] },
    });
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledOnce();
    second.unsubscribe(secondCallback);
    expect(ros.listenerCount(first.name)).toBe(0);
    expect(ros.listenerCount("close")).toBe(0);
    expect(sent("unsubscribe")).toHaveLength(2);
  });

  it("resubscribes with the original topic type and QoS after reconnect", () => {
    const topic = createAction().getStatusTopic();
    const callback = vi.fn();
    topic.subscribe(callback);
    ros.emit("close", {});
    ros.emit("connection", {});
    expect(sent("subscribe")).toHaveLength(2);
    expect(sent("subscribe")[1]).toEqual(sent("subscribe")[0]);
    topic.unsubscribe(callback);
    ros.emit("close", {});
    expect(sent("subscribe")).toHaveLength(2);
  });
});
