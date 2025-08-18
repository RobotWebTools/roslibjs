// Base interface for common fields across all operations

import { hasOwn } from '../util/type-utils.ts';
import { GoalStatus } from './RosMessageTypes.ts';

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type BridgeCompressionType = 'none' | 'png' | 'cbor' | 'cbor-raw';
export type BridgeStatusLevel = 'info' | 'warning' | 'error' | 'none';

export interface BaseOp<T extends string> {
  op: T;
  id?: string;
}

export interface QoSOp<T extends string> extends BaseOp<T> {
  /**
   * ROS1: Passed to publisher
   * ROS2: Sets QoS to infinite lifespan and depth of 1
   */
  latch?: boolean;
  /**
   * ROS1: Passed to publisher
   * ROS2: Sets the QoS Queue Depth
   */
  queue_size?: number;
}

export interface AuthOp extends BaseOp<'auth'> {
  mac: string;
  client: string;
  dest: string;
  rand: string;
  t: Date | number;
  level: string;
  end: Date | number;
}

// Data transformation operations
export interface FragmentOp extends BaseOp<'fragment'> {
  /**
   * An id is required for fragmented messages, in order to identify corresponding fragments for the fragmented message.
   */
  id: string;
  /**
   * A fragment of data that, when combined with other fragments of data, makes up another message
   */
  data: string;
  /**
   * The index of the fragment in the message
   */
  num: number;
  /**
   * The total number of fragments
   */
  total: number;
}

export interface PngOp extends BaseOp<'png'> {
  /**
   * Only required if the message is fragmented. Identifies the fragments for the fragmented message.
   */
  id?: string;
  /**
   * A fragment of a PNG-encoded message or an entire message.
   */
  data: string;
  /**
   * Only required if the message is fragmented. The index of the fragment.
   */
  num?: number;
  /**
   * Only required if the message is fragmented. The total number of fragments.
   */
  total?: number;
}

// Status operations
export interface SetStatusLevelOp extends BaseOp<'set_level'> {
  level: BridgeStatusLevel;
}

export interface StatusOp extends BaseOp<'status'> {
  /**
   * If the status message was the result of some operation that had an id, then that id is included
   */
  id?: string;
  /**
   * The level of this status message
   */
  level: BridgeStatusLevel;
  /**
   * The string message being logged
   */
  msg: string;
}

// Topic operations

/**
 *
 * If the topic does not already exist, and the type specified is a valid type, then the topic will be established with this type.
 *
 * If the topic already exists with a different type, an error status message is sent and this message is dropped.
 *
 * If the topic already exists with the same type, the sender of this message is registered as another publisher.
 *
 * If the topic doesn't already exist but the type cannot be resolved, then an error status message is sent and this message is dropped.
 */
export interface AdvertiseOp extends QoSOp<'advertise'> {
  /**
   * The string name of the topic to advertise
   */
  topic: string;
  /**
   * The string type to advertise for the topic
   */
  type: string;
}

/**
 * If the topic does not exist, a warning status message is sent and this message is dropped
 *
 * If the topic exists and there are still clients left advertising it, rosbridge will continue to advertise it until all of them have unadvertised
 *
 * If the topic exists but rosbridge is not advertising it, a warning status message is sent and this message is dropped
 */
export interface UnadvertiseOp extends BaseOp<'unadvertise'> {
  /**
   * The string name of the topic being unadvertised
   */
  topic: string;
}

/**
 * The publish command publishes a message on a topic.
 *
 * If the topic does not exist, then an error status message is sent and this message is dropped
 *
 * If the msg does not conform to the type of the topic, then an error status message is sent and this message is dropped
 *
 * If the msg is a subset of the type of the topic, then a warning status message is sent and the unspecified fields are filled in with defaults
 *
 * Special case: if the type being published has a 'header' field, then the client can optionally omit the header from the msg.
 * If this happens, rosbridge will automatically populate the header with a frame id of "" and the timestamp as the current time.
 * Alternatively, just the timestamp field can be omitted, and then the current time will be automatically inserted.
 */
export interface PublishOp extends QoSOp<'publish'> {
  topic: string;
  msg: unknown;
}

/**
 * This command subscribes the client to the specified topic.
 * It is recommended that if the client has multiple components subscribing to the same topic, that each component
 * makes its own subscription request providing an ID. That way, each can individually unsubscribe and rosbridge can select the correct rate at which to send messages.
 *
 * If queue_length is specified, then messages are placed into the queue before being sent.
 * Messages are sent from the head of the queue. If the queue gets full, the oldest message is removed and
 * replaced by the newest message.
 *
 * If a client has multiple subscriptions to the same topic, then messages are sent at the lowest throttle_rate,
 * with the lowest fragmentation size, and highest queue_length.
 * It is recommended that the client provides IDs for its subscriptions to enable rosbridge to effectively
 * choose the appropriate fragmentation size and publishing rate.
 */
export interface SubscribeOp extends BaseOp<'subscribe'> {
  /**
   * If specified, then this specific subscription can be unsubscribed by referencing the ID.
   */
  id?: string;
  /**
   * The (expected) type of the topic to subscribe to.
   * If left off, type will be inferred, and if the topic doesn't exist then the command to subscribe will fail
   */
  topic: string;
  /**
   * The name of the topic to subscribe to
   */
  type: string;
  /**
   * The minimum amount of time (in ms) that must elapse between messages being sent. Defaults to 0
   */
  throttle_rate?: number;
  /**
   * the size of the queue to buffer messages. Messages are buffered as a result of the throttle_rate. Defaults to 0 (no queueing).
   */
  queue_length?: number;
  /**
   * The maximum size that a message can take before it is to be fragmented.
   */
  fragment_size?: number;
  /**
   * An optional string to specify the compression scheme to be used on messages.
   * Valid values are "none", "png", "cbor", and "cbor-raw".
   */
  compression?: BridgeCompressionType;
}

export interface UnsubscribeOp extends BaseOp<'unsubscribe'> {
  /**
   * An id of the subscription to unsubscribe.
   * If an id is provided, then only the corresponding subscription is unsubscribed.
   * If no ID is provided, then all subscriptions are unsubscribed.
   */
  id?: string;
  /**
   * The name of the topic to unsubscribe from
   */
  topic: string;
}

// Service operations

/**
 * Advertises an external ROS service server. Requests come to the client via Call Service.
 */
export interface AdvertiseServiceOp extends BaseOp<'advertise_service'> {
  /**
   * The name of the service to advertise
   */
  service: string;
  /**
   * The advertised service message type
   */
  type: string;
}

/**
 * Stops advertising an external ROS service server
 */
export interface UnadvertiseServiceOp extends BaseOp<'unadvertise_service'> {
  /**
   * The name of the service to unadvertise
   */
  service: string;
}

/**
 * Calls a ROS service.
 */
export interface CallServiceOp<TRequest extends object> extends BaseOp<'call_service'> {
  /**
   * An optional id to distinguish this service call
   */
  id?: string;
  /**
   * The name of the service to call
   */
  service: string;
  /**
   * if the service has no args, then args does not have to be provided, though an empty list is equally acceptable.
   * Args should be a list of json objects representing the arguments to the service
   */
  args?: TRequest;
  /**
   * The maximum size that the response message can take before it is fragmented
   */
  fragment_size?: number;
  /**
   * An optional string to specify the compression scheme to be used on messages. Valid values are "none" and "png"
   */
  compression?: Extract<BridgeCompressionType, 'none' | 'png'>;
  /**
   * The time, in seconds, to wait for a response from the server
   */
  timeout?: number;
}

/**
 * Operation sent by the Bridge to RosLibJS to call a locally advertised service.
 */
export type IncomingCallServiceOp<TRequest extends object> = RequiredFields<CallServiceOp<TRequest>, 'args'>

export interface ServiceResponseSuccessOp<TResponse extends object> extends BaseOp<'service_response'> {
  /**
   * If an ID was provided to the service request, then the service response will contain the ID
   */
  id: string;
  /**
   * The name of the service that was called
   */
  service: string;
  /**
   * The return values. If the service had no return values, then this field can be
   * omitted (and will be by the rosbridge server)
   */
  values?: TResponse;
  /**
   * Return value of service callback. true means success, false failure.
   */
  result: true;
}

export interface ServiceResponseFailedOp extends BaseOp<'service_response'> {
  /**
   * If an ID was provided to the service request, then the service response will contain the ID
   */
  id: string;
  /**
   * The name of the service that was called
   */
  service: string;
  /**
   * The return values. If the service had no return values, then this field can be
   * omitted (and will be by the rosbridge server)
   */
  values: string;
  /**
   * Return value of service callback. true means success, false failure.
   */
  result: false;
}

export interface ServiceResponseOp<TResponse extends object> extends BaseOp<'service_response'> {
  /**
   * If an ID was provided to the service request, then the service response will contain the ID
   */
  id: string;
  /**
   * The name of the service that was called
   */
  service: string;
  /**
   * The return values. If the service had no return values, then this field can be
   * omitted (and will be by the rosbridge server)
   */
  values: (TResponse | undefined) | string;
  /**
   * Return value of service callback. true means success, false failure.
   */
  result: boolean;
}

export type AnyServiceResponseOp<TResponse extends object> =
  ServiceResponseSuccessOp<TResponse>
  | ServiceResponseFailedOp;

// Action operations

/**
 * Advertises an external ROS action server.
 */
export interface AdvertiseActionOp extends BaseOp<'advertise_action'> {
  /**
   * The name of the action to advertise
   */
  action: string;
  /**
   * The advertised action message type
   */
  type: string;
}

/**
 * Unadvertises an external ROS action server.
 */
export interface UnadvertiseActionOp extends BaseOp<'unadvertise_action'> {
  /**
   * The name of the action to unadvertise
   */
  action: string;
}

/**
 * Sends a goal to a ROS action server.
 */
export interface SendActionGoalOp<TGoal extends object> extends BaseOp<'send_action_goal'> {
  /**
   * An optional id to distinguish this goal handle
   */
  id?: string;
  /**
   * The name of the action to send a goal to
   */
  action: string;
  /**
   * The action message type
   */
  action_type: string;
  /**
   * If the goal has no args, then args does not have to be provided, though an empty list is equally acceptable.
   * Args should be a list of json objects representing the arguments to the service.
   */
  args: TGoal;
  /**
   * If true, sends feedback messages over rosbridge. Defaults to false.
   */
  feedback?: boolean;
  /**
   * The maximum size that the result and feedback messages can take before they are fragmented
   */
  fragment_size?: number;
  /**
   * An optional string to specify the compression scheme to be used on messages. Valid values are "none" and "png"
   */
  compression?: Extract<BridgeCompressionType, 'none' | 'png'>;
}

export interface CancelActionGoalOp extends BaseOp<'cancel_action_goal'> {
  /**
   * The id representing the goal handle to cancel.
   * The id field must match an already in-progress goal.
   */
  id: string;
  /**
   * The name of the action to cancel
   */
  action: string;
}

/**
 * Used to send action feedback for a specific goal handle.
 */
export interface ActionFeedbackOp<TFeedback extends object> extends BaseOp<'action_feedback'> {
  /**
   * The id representing the goal handle.
   * The id field must match an already in-progress goal.
   */
  id: string;
  /**
   * The name of the action to cancel
   */
  action: string;
  /**
   * The feedback values
   */
  values: TFeedback;
}

/**
 * A result for a ROS action.
 */
export interface ActionResultSuccessOp<TResult extends object> extends BaseOp<'action_result'> {
  /**
   * If an ID was provided to the action goal, then the action result will contain the ID
   */
  id: string;
  /**
   * The name of the action that was executed
   */
  action: string;
  /**
   * The result values. If the service had no return values, then this field can be omitted (and will be by the rosbridge server)
   */
  values: TResult;
  /**
   * Return status of the action. This matches the enumeration in the action_msgs/msg/GoalStatus ROS message.
   */
  status: GoalStatus;
  /**
   * Return value of action. True means success, false failure.
   */
  result: true;
}

/**
 * A result for a ROS action.
 */
export interface ActionResultFailedOp extends BaseOp<'action_result'> {
  /**
   * If an ID was provided to the action goal, then the action result will contain the ID
   */
  id: string;
  /**
   * The name of the action that was executed
   */
  action: string;
  /**
   * The result values. If the service had no return values, then this field can be omitted (and will be by the rosbridge server)
   */
  values?: string;
  /**
   * Return status of the action. This matches the enumeration in the action_msgs/msg/GoalStatus ROS message.
   */
  status: GoalStatus;
  /**
   * Return value of action. True means success, false failure.
   */
  result: false;
}

export type AnyActionOp<TGoal extends object, TFeedback extends object, TResult extends object> =
  AdvertiseActionOp
  | UnadvertiseActionOp
  | SendActionGoalOp<TGoal>
  | CancelActionGoalOp
  | ActionFeedbackOp<TFeedback>
  | ActionResultSuccessOp<TResult>
  | ActionResultFailedOp;


// The discriminated union type for all RosBridge operations
export type BridgeProtoOp<T extends object = object> =
  | AuthOp
  | FragmentOp
  | PngOp
  | SetStatusLevelOp
  | StatusOp
  | AdvertiseOp
  | UnadvertiseOp
  | PublishOp
  | SubscribeOp
  | UnsubscribeOp
  | AdvertiseServiceOp
  | UnadvertiseServiceOp
  | CallServiceOp<T>
  | ServiceResponseSuccessOp<T>
  | ServiceResponseFailedOp
  | ServiceResponseOp<T>
  | AdvertiseActionOp
  | UnadvertiseActionOp
  | SendActionGoalOp<T>
  | CancelActionGoalOp
  | ActionFeedbackOp<T>
  | ActionResultSuccessOp<T>
  | ActionResultFailedOp;

export type BridgeProtoOpKey = BridgeProtoOp['op'];

// Type guard to check if an unknown object is a valid BridgeProtoOp
export function isBridgeProtoOp(obj: unknown): obj is BridgeProtoOp {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    hasOwn(obj, 'op') &&
    typeof obj.op === 'string'
  );
}

export function isServiceResponseSuccess(obj: unknown): obj is ServiceResponseSuccessOp<never> {
  return isBridgeProtoOp(obj) &&
    obj.op === 'service_response' &&
    hasOwn(obj, 'result') &&
    obj.result;
}
