interface RosbridgeMessage {
  op: string;
}

export interface RosbridgeFragmentMessage extends RosbridgeMessage {
  op: 'fragment';
  id: string;
  data: string;
  num: number;
  total: number;
}

export interface RosbridgePngMessage extends RosbridgeMessage {
  op: 'png';
  id?: string;
  data: string;
  num?: number;
  total?: number;
}

export interface RosbridgeAdvertiseMessage extends RosbridgeMessage {
  op: 'advertise';
  id?: string;
  type: string;
  topic: string;
}

export interface RosbridgeUnadvertiseMessage extends RosbridgeMessage {
  op: 'unadvertise';
  id?: string;
  topic: string;
}

export interface RosbridgePublishMessage<TMessage = unknown>
  extends RosbridgeMessage {
  op: 'publish';
  id?: string;
  topic: string;
  msg: TMessage;
}

export interface RosbridgeSubscribeMessage extends RosbridgeMessage {
  op: 'subscribe';
  id?: string;
  topic: string;
  type?: string;
  throttle_rate?: number;
  queue_length?: number;
  fragment_size?: number;
  compression?: string;
}

export interface RosbridgeUnsubscribeMessage extends RosbridgeMessage {
  op: 'unsubscribe';
  id?: string;
  topic: string;
}

export interface RosbridgeAdvertiseServiceMessage extends RosbridgeMessage {
  op: 'advertise_service';
  type: string;
  service: string;
}

export interface RosbridgeUnadvertiseServiceMessage extends RosbridgeMessage {
  op: 'unadvertise_service';
  service: string;
}

export interface RosbridgeCallServiceMessage<TArgs = unknown[]>
  extends RosbridgeMessage {
  op: 'call_service';
  id?: string;
  service: string;
  args?: TArgs;
  fragment_size?: number;
  compression?: string;
  timeout?: number;
}

export interface RosbridgeServiceResponseMessage<TValues = unknown[]>
  extends RosbridgeMessage {
  op: 'service_response';
  id?: string;
  service: string;
  values?: TValues;
  result: boolean;
}

export interface RosbridgeAdvertiseActionMessage extends RosbridgeMessage {
  op: 'advertise_action';
  type: string;
  action: string;
}

export interface RosbridgeUnadvertiseActionMessage extends RosbridgeMessage {
  op: 'unadvertise_action';
  action: string;
}

export interface RosbridgeSendActionGoalMessage<TArgs = unknown[]>
  extends RosbridgeMessage {
  op: 'send_action_goal';
  id?: string;
  action: string;
  action_type: string;
  args?: TArgs;
  feedback?: boolean;
  fragment_size?: number;
  compression?: string;
}

export interface RosbridgeCancelActionGoalMessage extends RosbridgeMessage {
  op: 'cancel_action_goal';
  id: string;
  action: string;
}

export interface RosbridgeActionFeedbackMessage<TFeedback>
  extends RosbridgeMessage {
  op: 'action_feedback';
  id: string;
  action: string;
  values: TFeedback;
}

export interface RosbridgeActionResultMessage<TResultValues>
  extends RosbridgeMessage {
  op: 'action_result';
  id: string;
  action: string;
  values: TResultValues;
  status: number;
  result: boolean;
}
