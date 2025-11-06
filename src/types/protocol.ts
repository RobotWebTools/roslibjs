export interface RosbridgeMessage {
  op: string;
}

export function isRosbridgeMessage(
  message: unknown,
): message is RosbridgeMessage {
  return message instanceof Object && typeof message["op"] === "string";
}

export interface RosbridgeStatusMessage extends RosbridgeMessage {
  op: "status";
  id?: string;
  level: string;
  msg: string;
}

export function isRosbridgeStatusMessage(
  message: RosbridgeMessage,
): message is RosbridgeStatusMessage {
  return message.op === "status";
}

export interface RosbridgeFragmentMessage extends RosbridgeMessage {
  op: "fragment";
  id: string;
  data: string;
  num: number;
  total: number;
}

export function isRosbridgeFragmentMessage(
  message: RosbridgeMessage,
): message is RosbridgeFragmentMessage {
  return message.op === "fragment";
}

export interface RosbridgePngMessage extends RosbridgeMessage {
  op: "png";
  id?: string;
  data: string;
  num?: number;
  total?: number;
}

export function isRosbridgePngMessage(
  message: RosbridgeMessage,
): message is RosbridgePngMessage {
  return message.op === "png";
}

export interface RosbridgeAdvertiseMessage extends RosbridgeMessage {
  op: "advertise";
  id?: string;
  type: string;
  topic: string;
  latch?: boolean;
  queue_size?: number;
}

export function isRosbridgeAdvertiseMessage(
  message: RosbridgeMessage,
): message is RosbridgeAdvertiseMessage {
  return message.op === "advertise";
}

export interface RosbridgeUnadvertiseMessage extends RosbridgeMessage {
  op: "unadvertise";
  id?: string;
  topic: string;
}

export function isRosbridgeUnadvertiseMessage(
  message: RosbridgeMessage,
): message is RosbridgeUnadvertiseMessage {
  return message.op === "unadvertise";
}

export interface RosbridgePublishMessage<TMessage = unknown>
  extends RosbridgeMessage {
  op: "publish";
  id?: string;
  topic: string;
  msg: TMessage;
}

export function isRosbridgePublishMessage(
  message: RosbridgeMessage,
): message is RosbridgePublishMessage {
  return message.op === "publish";
}

export interface RosbridgeSubscribeMessage extends RosbridgeMessage {
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
  message: RosbridgeMessage,
): message is RosbridgeSubscribeMessage {
  return message.op === "subscribe";
}

export interface RosbridgeUnsubscribeMessage extends RosbridgeMessage {
  op: "unsubscribe";
  id?: string;
  topic: string;
}

export function isRosbridgeUnsubscribeMessage(
  message: RosbridgeMessage,
): message is RosbridgeUnsubscribeMessage {
  return message.op === "unsubscribe";
}

export interface RosbridgeAdvertiseServiceMessage extends RosbridgeMessage {
  op: "advertise_service";
  type: string;
  service: string;
}

export function isRosbridgeAdvertiseServiceMessage(
  message: RosbridgeMessage,
): message is RosbridgeAdvertiseServiceMessage {
  return message.op === "advertise_service";
}

export interface RosbridgeUnadvertiseServiceMessage extends RosbridgeMessage {
  op: "unadvertise_service";
  service: string;
}

export function isRosbridgeUnadvertiseServiceMessage(
  message: RosbridgeMessage,
): message is RosbridgeUnadvertiseServiceMessage {
  return message.op === "unadvertise_service";
}

export interface RosbridgeCallServiceMessage<TArgs = void>
  extends RosbridgeMessage {
  op: "call_service";
  id?: string;
  service: string;
  args: TArgs;
  fragment_size?: number;
  compression?: string;
  timeout?: number;
}

export function isRosbridgeCallServiceMessage(
  message: RosbridgeMessage,
): message is RosbridgeCallServiceMessage {
  return message.op === "call_service";
}

export interface RosbridgeServiceResponseMessage<TValues = unknown[]>
  extends RosbridgeMessage {
  op: "service_response";
  id?: string;
  service: string;
  values?: TValues;
  result: boolean;
}

export function isRosbridgeServiceResponseMessage(
  message: RosbridgeMessage,
): message is RosbridgeServiceResponseMessage {
  return message.op === "service_response";
}

export interface RosbridgeAdvertiseActionMessage extends RosbridgeMessage {
  op: "advertise_action";
  type: string;
  action: string;
}

export function isRosbridgeAdvertiseActionMessage(
  message: RosbridgeMessage,
): message is RosbridgeAdvertiseActionMessage {
  return message.op === "advertise_action";
}

export interface RosbridgeUnadvertiseActionMessage extends RosbridgeMessage {
  op: "unadvertise_action";
  action: string;
}

export function isRosbridgeUnadvertiseActionMessage(
  message: RosbridgeMessage,
): message is RosbridgeUnadvertiseActionMessage {
  return message.op === "unadvertise_action";
}

export interface RosbridgeSendActionGoalMessage<TArgs = unknown>
  extends RosbridgeMessage {
  op: "send_action_goal";
  id?: string;
  action: string;
  action_type: string;
  args?: TArgs;
  feedback?: boolean;
  fragment_size?: number;
  compression?: string;
}

export function isRosbridgeSendActionGoalMessage(
  message: RosbridgeMessage,
): message is RosbridgeSendActionGoalMessage {
  return message.op === "send_action_goal";
}

export interface RosbridgeCancelActionGoalMessage extends RosbridgeMessage {
  op: "cancel_action_goal";
  id: string;
  action: string;
}

export function isRosbridgeCancelActionGoalMessage(
  message: RosbridgeMessage,
): message is RosbridgeCancelActionGoalMessage {
  return message.op === "cancel_action_goal";
}

export interface RosbridgeActionFeedbackMessage<TFeedback = unknown>
  extends RosbridgeMessage {
  op: "action_feedback";
  id: string;
  action: string;
  values: TFeedback;
}

export function isRosbridgeActionFeedbackMessage<TFeedback = unknown>(
  message: RosbridgeMessage,
): message is RosbridgeActionFeedbackMessage<TFeedback> {
  return message.op === "action_feedback";
}

export interface RosbridgeActionResultMessage<TResultValues = unknown>
  extends RosbridgeMessage {
  op: "action_result";
  id: string;
  action: string;
  values: TResultValues;
  status: number;
  result: boolean;
}

export function isRosbridgeActionResultMessage(
  message: RosbridgeMessage,
): message is RosbridgeActionResultMessage {
  return message.op === "action_result";
}

export interface RosbridgeActionStatusMessage extends RosbridgeMessage {
  op: "action_status";
  id: string;
  action: string;
  status: number;
}

export function isRosbridgeActionStatusMessage(
  message: RosbridgeMessage,
): message is RosbridgeActionStatusMessage {
  return message.op === "action_status";
}
