import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "eventemitter3";
import Topic from "../src/core/Topic.ts";
import type Ros from "../src/core/Ros.ts";
import type {
  RosbridgeMessage,
  RosbridgeQosProfile,
} from "../src/types/protocol.ts";

const qos: RosbridgeQosProfile = {
  history: "keep_last",
  depth: 5,
  reliability: "best_effort",
  durability: "transient_local",
  deadline: { secs: 1, nsecs: 500000000 },
  lifespan: "infinite",
};

describe("Topic QoS", () => {
  let mockRos: Ros & EventEmitter;
  let callOnConnection: ReturnType<
    typeof vi.fn<(msg: RosbridgeMessage) => void>
  >;

  /** All messages sent to the server with the given op, as they go over the wire */
  function sent(op: string): Record<string, unknown>[] {
    return callOnConnection.mock.calls
      .map(
        ([msg]) => JSON.parse(JSON.stringify(msg)) as Record<string, unknown>,
      )
      .filter((msg) => msg["op"] === op);
  }

  beforeEach(() => {
    callOnConnection = vi.fn<(msg: RosbridgeMessage) => void>();
    mockRos = Object.assign(new EventEmitter(), {
      callOnConnection,
    }) as unknown as Ros & EventEmitter;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function makeTopic(options: { qos?: RosbridgeQosProfile } = {}) {
    return new Topic({
      ros: mockRos,
      name: "/chatter",
      messageType: "std_msgs/msg/String",
      ...options,
    });
  }

  it("sends the qos profile when advertising", () => {
    makeTopic({ qos }).advertise();

    const [advertise] = sent("advertise");
    expect(advertise).toMatchObject({
      topic: "/chatter",
      type: "std_msgs/msg/String",
      qos,
    });
  });

  it("sends the qos profile when subscribing", () => {
    makeTopic({ qos }).subscribe(() => undefined);

    const [subscribe] = sent("subscribe");
    expect(subscribe).toMatchObject({
      topic: "/chatter",
      type: "std_msgs/msg/String",
      qos,
    });
  });

  it("advertises with qos before the first publish", () => {
    const topic = makeTopic({ qos });
    topic.publish({ data: "hello" });
    topic.publish({ data: "again" });

    expect(sent("advertise")).toHaveLength(1);
    expect(sent("advertise")[0]).toMatchObject({ qos });
    expect(sent("publish")).toHaveLength(2);
    // QoS belongs to the advertisement; the publish messages don't repeat it
    for (const publish of sent("publish")) {
      expect(publish).not.toHaveProperty("qos");
    }
  });

  it("passes an empty profile through to request full system-default QoS", () => {
    makeTopic({ qos: {} }).advertise();

    expect(sent("advertise")[0]).toHaveProperty("qos", {});
  });

  it("omits the qos field when no profile is given", () => {
    const topic = makeTopic();
    topic.advertise();
    topic.subscribe(() => undefined);

    expect(sent("advertise")[0]).not.toHaveProperty("qos");
    expect(sent("subscribe")[0]).not.toHaveProperty("qos");
    // Old servers still get the legacy fields
    expect(sent("advertise")[0]).toMatchObject({
      latch: false,
      queue_size: 100,
    });
  });

  it("re-sends the qos profile when re-advertising after reconnect", () => {
    makeTopic({ qos }).advertise();

    mockRos.emit("close");

    expect(sent("advertise")).toHaveLength(2);
    expect(sent("advertise")[1]).toMatchObject({ qos });
  });

  it("re-sends the qos profile when re-subscribing after reconnect", () => {
    makeTopic({ qos }).subscribe(() => undefined);

    mockRos.emit("close");

    expect(sent("subscribe")).toHaveLength(2);
    expect(sent("subscribe")[1]).toMatchObject({ qos });
  });
});
