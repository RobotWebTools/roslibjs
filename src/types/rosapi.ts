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
  interface GetParamResponseFailed {
    value: never;
    successful: false;
    reason: string;
  }
  interface GetParamResponseSuccess {
    value: string;
    successful: true;
    reason: never;
  }
  export type GetParamResponse =
    | GetParamResponseFailed
    | GetParamResponseSuccess;
  export interface SetParamRequest {
    name: string;
    value: string;
  }
  export interface SetParamResponse {
    successful: boolean;
    reason: string;
  }
  export interface DeleteParamRequest {
    name: string;
  }
  export interface DeleteParamResponse {
    successful: boolean;
    reason: string;
  }
}
