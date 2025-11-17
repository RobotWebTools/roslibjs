/**
 * https://github.com/RobotWebTools/rosbridge_suite/blob/ros2/ROSBRIDGE_PROTOCOL.md
 */

export interface RosbridgeMessageBase {
  op: string;
}

export function isRosbridgeMessage(
  message: unknown,
): message is RosbridgeMessageBase {
  return (
    message instanceof Object &&
    "op" in message &&
    typeof message.op === "string"
  );
}

export interface RosbridgeAuthMessage extends RosbridgeMessageBase {
  op: "auth";
  mac: string;
  client: string;
  dest: string;
  rand: string;
  t: number;
  level: string;
  end: number;
}

export interface RosbridgeStatusMessage extends RosbridgeMessageBase {
  op: "status";
  id?: string;
  level: string;
  msg: string;
}

export function isRosbridgeStatusMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeStatusMessage {
  return message.op === "status";
}

export interface RosbridgeSetStatusLevelMessage extends RosbridgeMessageBase {
  op: "set_level";
  id?: string;
  level: "info" | "warning" | "error" | "none";
}

export function isRosbridgeSetStatusLevelMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeSetStatusLevelMessage {
  return message.op === "set_level";
}

export interface RosbridgeFragmentMessage extends RosbridgeMessageBase {
  op: "fragment";
  id: string;
  data: string;
  num: number;
  total: number;
}

export function isRosbridgeFragmentMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeFragmentMessage {
  return message.op === "fragment";
}

export interface RosbridgePngMessage extends RosbridgeMessageBase {
  op: "png";
  id?: string;
  data: string;
  num?: number;
  total?: number;
}

export function isRosbridgePngMessage(
  message: RosbridgeMessageBase,
): message is RosbridgePngMessage {
  return message.op === "png";
}

export interface RosbridgeAdvertiseMessage extends RosbridgeMessageBase {
  op: "advertise";
  id?: string;
  type: string;
  topic: string;
  latch?: boolean;
  queue_size?: number;
}

export function isRosbridgeAdvertiseMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeAdvertiseMessage {
  return message.op === "advertise";
}

export interface RosbridgeUnadvertiseMessage extends RosbridgeMessageBase {
  op: "unadvertise";
  id?: string;
  topic: string;
}

export function isRosbridgeUnadvertiseMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeUnadvertiseMessage {
  return message.op === "unadvertise";
}

export interface RosbridgePublishMessage<TMessage = unknown>
  extends RosbridgeMessageBase {
  op: "publish";
  id?: string;
  topic: string;
  msg: TMessage;
}

export function isRosbridgePublishMessage<T>(
  message: RosbridgeMessageBase,
): message is RosbridgePublishMessage<T> {
  return message.op === "publish";
}

export interface RosbridgeSubscribeMessage extends RosbridgeMessageBase {
  op: "subscribe";
  id?: string;
  topic: string;
  type?: string;
  throttle_rate?: number;
  queue_length?: number;
  fragment_size?: number;
  compression?: string;
}

export function isRosbridgeSubscribeMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeSubscribeMessage {
  return message.op === "subscribe";
}

export interface RosbridgeUnsubscribeMessage extends RosbridgeMessageBase {
  op: "unsubscribe";
  id?: string;
  topic: string;
}

export function isRosbridgeUnsubscribeMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeUnsubscribeMessage {
  return message.op === "unsubscribe";
}

export interface RosbridgeAdvertiseServiceMessage extends RosbridgeMessageBase {
  op: "advertise_service";
  type: string;
  service: string;
}

export function isRosbridgeAdvertiseServiceMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeAdvertiseServiceMessage {
  return message.op === "advertise_service";
}

export interface RosbridgeUnadvertiseServiceMessage
  extends RosbridgeMessageBase {
  op: "unadvertise_service";
  service: string;
}

export function isRosbridgeUnadvertiseServiceMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeUnadvertiseServiceMessage {
  return message.op === "unadvertise_service";
}

export interface RosbridgeCallServiceMessage<TArgs = unknown>
  extends RosbridgeMessageBase {
  op: "call_service";
  id?: string;
  service: string;
  /**
   * TODO this should be deeply partial when *outgoing*, because rosbridge will "fill in the blanks",
   * but it's not partial when *incoming* - need to figure out a way to represent this.
   */
  args: TArgs;
  fragment_size?: number;
  compression?: string;
  timeout?: number;
}

export function isRosbridgeCallServiceMessage<T>(
  message: RosbridgeMessageBase,
): message is RosbridgeCallServiceMessage<T> {
  return message.op === "call_service";
}

interface BaseRosbridgeServiceResponseMessage extends RosbridgeMessageBase {
  op: "service_response";
  id?: string;
  service: string;
}

/** If the service call failed, `values` will be a string error message. */
export interface FailedRosbridgeServiceResponseMessage
  extends BaseRosbridgeServiceResponseMessage {
  values?: string;
  result: false;
}

export interface SuccessfulRosbridgeServiceResponseMessage<TValues = unknown>
  extends BaseRosbridgeServiceResponseMessage {
  values: TValues;
  result: true;
}

export type RosbridgeServiceResponseMessage<TValues = unknown> =
  | FailedRosbridgeServiceResponseMessage
  | SuccessfulRosbridgeServiceResponseMessage<TValues>;

export function isRosbridgeServiceResponseMessage<T>(
  message: RosbridgeMessageBase,
): message is RosbridgeServiceResponseMessage<T> {
  return message.op === "service_response";
}

export interface RosbridgeAdvertiseActionMessage extends RosbridgeMessageBase {
  op: "advertise_action";
  type: string;
  action: string;
}

export function isRosbridgeAdvertiseActionMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeAdvertiseActionMessage {
  return message.op === "advertise_action";
}

export interface RosbridgeUnadvertiseActionMessage
  extends RosbridgeMessageBase {
  op: "unadvertise_action";
  action: string;
}

export function isRosbridgeUnadvertiseActionMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeUnadvertiseActionMessage {
  return message.op === "unadvertise_action";
}

export interface RosbridgeSendActionGoalMessage<TArgs = unknown>
  extends RosbridgeMessageBase {
  op: "send_action_goal";
  id: string;
  action: string;
  action_type: string;
  args?: TArgs;
  feedback?: boolean;
  fragment_size?: number;
  compression?: string;
}

export function isRosbridgeSendActionGoalMessage<TArgs = unknown>(
  message: RosbridgeMessageBase,
): message is RosbridgeSendActionGoalMessage<TArgs> {
  return message.op === "send_action_goal";
}

export interface RosbridgeCancelActionGoalMessage extends RosbridgeMessageBase {
  op: "cancel_action_goal";
  id: string;
  action: string;
}

export function isRosbridgeCancelActionGoalMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeCancelActionGoalMessage {
  return message.op === "cancel_action_goal";
}

export interface RosbridgeActionFeedbackMessage<TFeedback = unknown>
  extends RosbridgeMessageBase {
  op: "action_feedback";
  id: string;
  action: string;
  values: TFeedback;
}

export function isRosbridgeActionFeedbackMessage<TFeedback = unknown>(
  message: RosbridgeMessageBase,
): message is RosbridgeActionFeedbackMessage<TFeedback> {
  return message.op === "action_feedback";
}

interface RosbridgeActionResultMessageBase extends RosbridgeMessageBase {
  op: "action_result";
  id: string;
  action: string;
  status: number;
}

export interface FailedRosbridgeActionResultMessage
  extends RosbridgeActionResultMessageBase {
  result: false;
  values?: string;
}

export interface SuccessfulRosbridgeActionResultMessage<TResultValues = unknown>
  extends RosbridgeActionResultMessageBase {
  values: TResultValues;
  result: true;
}

export type RosbridgeActionResultMessage<TResultValues = unknown> =
  | FailedRosbridgeActionResultMessage
  | SuccessfulRosbridgeActionResultMessage<TResultValues>;

export function isRosbridgeActionResultMessage<TResultValues = unknown>(
  message: RosbridgeMessageBase,
): message is RosbridgeActionResultMessage<TResultValues> {
  return message.op === "action_result";
}

export interface RosbridgeActionStatusMessage extends RosbridgeMessageBase {
  op: "action_status";
  id: string;
  action: string;
  status: number;
}

export function isRosbridgeActionStatusMessage(
  message: RosbridgeMessageBase,
): message is RosbridgeActionStatusMessage {
  return message.op === "action_status";
}

export type RosbridgeMessage =
  | RosbridgeAuthMessage
  | RosbridgeStatusMessage
  | RosbridgeSetStatusLevelMessage
  | RosbridgeFragmentMessage
  | RosbridgePngMessage
  | RosbridgeAdvertiseMessage
  | RosbridgeUnadvertiseMessage
  | RosbridgePublishMessage
  | RosbridgeSubscribeMessage
  | RosbridgeUnsubscribeMessage
  | RosbridgeAdvertiseServiceMessage
  | RosbridgeUnadvertiseServiceMessage
  | RosbridgeCallServiceMessage
  | RosbridgeServiceResponseMessage
  | RosbridgeAdvertiseActionMessage
  | RosbridgeUnadvertiseActionMessage
  | RosbridgeSendActionGoalMessage
  | RosbridgeCancelActionGoalMessage
  | RosbridgeActionFeedbackMessage
  | RosbridgeActionResultMessage;
