import { expectTypeOf, it } from "vitest";
import type { GoalStatus, Topic } from "../src/RosLib.ts";
import {
  Action,
  Ros,
  type action_msgs,
  type ActionTopicOptions,
  type ActionFeedbackMessage,
} from "../src/RosLib.ts";

it("preserves feedback and ROS 2 status types", () => {
  const action = new Action<
    { order: number },
    { sequence: number[] },
    { sequence: number[] }
  >({
    ros: new Ros(),
    name: "/fibonacci",
    actionType: "example_interfaces/action/Fibonacci",
  });
  expectTypeOf(action.getFeedbackTopic()).toEqualTypeOf<
    Topic<ActionFeedbackMessage<{ sequence: number[] }>>
  >();
  expectTypeOf(action.getStatusTopic()).toEqualTypeOf<
    Topic<action_msgs.GoalStatusArray>
  >();
  action.getFeedbackTopic().subscribe((message) => {
    expectTypeOf(message.feedback.sequence).toEqualTypeOf<number[]>();
    expectTypeOf(message.goal_id.uuid).toEqualTypeOf<
      string | number[] | Uint8Array
    >();
    // @ts-expect-error Feedback is wrapped, not a bare action feedback payload.
    expectTypeOf(message.sequence);
  });
  action.getStatusTopic().subscribe((message) => {
    const first = message.status_list[0];
    if (first) {
      expectTypeOf(first.status).toEqualTypeOf<GoalStatus>();
      expectTypeOf(first.goal_info.stamp).toEqualTypeOf<{
        sec: number;
        nanosec: number;
      }>();
    }
    // @ts-expect-error ROS 2 status arrays have no ROS 1 Header.
    expectTypeOf(message.header);
  });
  const options: ActionTopicOptions = {
    qos: { depth: 1, durability: "transient_local" },
    reconnect_on_close: false,
  };
  action.getStatusTopic(options);
  // @ts-expect-error Action topic names are derived from the action.
  action.getStatusTopic({ name: "/other" });
  // @ts-expect-error Feedback message types are derived from the action type.
  action.getFeedbackTopic({ messageType: "std_msgs/msg/String" });
  // @ts-expect-error Legacy publisher latch options do not apply to these subscriptions.
  action.getStatusTopic({ latch: true });
});
