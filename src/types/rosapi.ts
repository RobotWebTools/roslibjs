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
}
