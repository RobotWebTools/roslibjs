import type { TransportEvent } from "../core/transport/Transport.js";
import type {
  BridgeProtoOpKey,
  AnyActionOp,
  AnyServiceOp,
} from "./protocol.js";

export type TransportEventString = "open" | "close" | "error";
export type TransportEvents = Record<
  TransportEventString,
  [event: TransportEvent]
>;

export type ActionIdString = `send_action_goal:${string}:${string}`;
export type ServiceCallIdString = `call_service:${string}:${string}`;
export type TopicKey = Exclude<
  string,
  TransportEventString | ActionIdString | ServiceCallIdString | BridgeProtoOpKey
>;

// Event strings specific to actions
export type RosActionEvents = Record<
  ActionIdString,
  // Allow the action class to narrow the type itself.
  [message: AnyActionOp<never, never, never>]
>;

export type RosServiceEvents = Record<
  ServiceCallIdString,
  // Allow the action class to narrow the type itself.
  [message: AnyServiceOp<never, never>]
>;

export type RosEventTypes = TransportEvents &
  RosActionEvents & // Action Events
  RosServiceEvents &
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<TopicKey, [message: any]>; // Service Calls & Topic messages, need to be `any` to be coerced by implementers
