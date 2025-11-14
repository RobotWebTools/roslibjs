// TODO: autogenerate these with ros-typescript-generator

export namespace rosapi {
  export interface TypeDef {
    type: string;
    fieldnames: string[];
    fieldtypes: string[];
    fieldarraylen: number[];
    examples: string[];
  }
  export interface ServiceResponseDetailsRequest {
    type: string;
  }
  export interface ServiceResponseDetailsResponse {
    typedefs: TypeDef[];
  }
  export interface ServiceRequestDetailsRequest {
    type: string;
  }
  export interface ServiceRequestDetailsResponse {
    typedefs: TypeDef[];
  }
  export interface PublishersRequest {
    topic: string;
  }
  export interface PublishersResponse {
    publishers: string[];
  }
  export interface GetParamRequest {
    name: string;
    default?: string;
  }
  export interface GetParamResponsePreJazzy {
    value: string;
  }
  export interface GetParamResponseFailedPostJazzy {
    value: never;
    successful: false;
    reason: string;
  }
  export interface GetParamResponseSuccessPostJazzy {
    value: string;
    successful: true;
    reason: never;
  }
  export type GetParamResponse =
    | GetParamResponsePreJazzy
    | GetParamResponseFailedPostJazzy
    | GetParamResponseSuccessPostJazzy;
  export interface SetParamRequest {
    name: string;
    value: string;
  }
  export type SetParamResponsePreJazzy = Record<never, never>;
  export interface FailedSetParamResponsePostJazzy {
    successful: false;
    reason: string;
  }
  export interface SuccessfulSetParamResponsePostJazzy {
    successful: true;
    reason: never;
  }
  export type SetParamResponse =
    | SetParamResponsePreJazzy
    | FailedSetParamResponsePostJazzy
    | SuccessfulSetParamResponsePostJazzy;
  export interface DeleteParamRequest {
    name: string;
  }
  export type DeleteParamResponsePreJazzy = Record<never, never>;
  export interface FailedDeleteParamResponsePostJazzy {
    successful: false;
    reason: string;
  }
  export interface SuccessfulDeleteParamResponsePostJazzy {
    successful: true;
    reason: never;
  }
  export type DeleteParamResponse =
    | DeleteParamResponsePreJazzy
    | FailedDeleteParamResponsePostJazzy
    | SuccessfulDeleteParamResponsePostJazzy;
  export type GetActionServersRequest = Record<never, never>;
  export interface GetActionServersResponse {
    action_servers: string[];
  }
  export type TopicsRequest = Record<never, never>;
  export interface TopicsResponse {
    topics: string[];
    types: string[];
  }
  export interface TopicsForTypeRequest {
    type: string;
  }
  export interface TopicsForTypeResponse {
    topics: string[];
  }
  export type ServicesRequest = Record<never, never>;
  export interface ServicesResponse {
    services: string[];
  }
  export interface ServicesForTypeRequest {
    type: string;
  }
  export interface ServicesForTypeResponse {
    services: string[];
  }
  export type NodesRequest = Record<never, never>;
  export interface NodesResponse {
    nodes: string[];
  }
  export interface NodeDetailsRequest {
    node: string;
  }
  export interface NodeDetailsResponse {
    subscribing: string[];
    publishing: string[];
    services: string[];
  }
  export type GetParamNamesRequest = Record<never, never>;
  export interface GetParamNamesResponse {
    names: string[];
  }
  export interface TopicTypeRequest {
    topic: string;
  }
  export interface TopicTypeResponse {
    type: string;
  }
  export interface ServiceTypeRequest {
    service: string;
  }
  export interface ServiceTypeResponse {
    type: string;
  }
  export interface MessageDetailsRequest {
    type: string;
  }
  export interface MessageDetailsResponse {
    typedefs: TypeDef[];
  }
  export type TopicsAndRawTypesRequest = Record<never, never>;
  export interface TopicsAndRawTypesResponse {
    topics: string[];
    types: string[];
    typedefs_full_text: string[];
  }
}
