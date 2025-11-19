/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import type {
  RosbridgeMessage,
  RosbridgeMessageBase,
  RosbridgeSetStatusLevelMessage,
} from "../types/protocol.ts";
import {
  isRosbridgeActionFeedbackMessage,
  isRosbridgeActionResultMessage,
  isRosbridgeCallServiceMessage,
  isRosbridgeCancelActionGoalMessage,
  isRosbridgePublishMessage,
  isRosbridgeSendActionGoalMessage,
  isRosbridgeServiceResponseMessage,
  isRosbridgeStatusMessage,
} from "../types/protocol.ts";

import Topic from "./Topic.ts";
import Service from "./Service.ts";
import Param from "./Param.ts";
import TFClient from "../tf/TFClient.ts";
import ActionClient from "../actionlib/ActionClient.ts";
import SimpleActionServer from "../actionlib/SimpleActionServer.ts";
import { EventEmitter } from "eventemitter3";
import type { rosapi } from "../types/rosapi.ts";
import type {
  ITransport,
  ITransportFactory,
  TransportEvent,
} from "./transport/Transport.ts";
import { WebSocketTransportFactory } from "./transport/WebSocketTransportFactory.ts";

export interface TypeDefDict {
  [key: string]: string | string[] | TypeDefDict | TypeDefDict[];
}

/**
 * Manages connection to the rosbridge server and all interactions with ROS.
 *
 * Emits the following events:
 *  * 'connection'  - Connected to the rosbridge server.
 *  * 'close' - Disconnected to the rosbridge server.
 *  * 'error' - There was an error with ROS.
 *  * &#60;topicName&#62; - A message came from rosbridge with the given topic name.
 *  * &#60;serviceID&#62; - A service response came from rosbridge with the given ID.
 */
export default class Ros extends EventEmitter<
  {
    connection: [TransportEvent];
    close: [TransportEvent];
    error: [TransportEvent];
    // Any dynamically-named event should correspond to a rosbridge protocol message
  } & Record<string, [RosbridgeMessage]>
> {
  // private write, public read via getter method
  #isConnected: boolean;

  private transport?: ITransport;
  private transportFactory: ITransportFactory;

  constructor({
    url,
    transportFactory = WebSocketTransportFactory,
  }: {
    /**
     * The rosbridge server URL. Can be specified later with `connect`.
     * If specified, then will immediately try to connect to the server.
     */
    url?: string;
    /**
     * The factory to use to create a transport.
     * Defaults to a WebSocket transport factory.
     */
    transportFactory?: ITransportFactory;
  } = {}) {
    super();

    this.#isConnected = false;
    this.transportFactory = transportFactory;

    if (url) {
      this.connect(url).catch(console.error);
    }
  }

  public get isConnected(): boolean {
    return this.#isConnected;
  }

  public async connect(url: string): Promise<void> {
    if (this.transport && !this.transport.isClosed()) {
      return; // Already connected
    }

    const transport = await this.transportFactory(url);
    this.transport = transport;

    transport.on("open", (event: TransportEvent) => {
      this.#isConnected = true;
      this.emit("connection", event);
    });

    transport.on("close", (event: TransportEvent) => {
      this.#isConnected = false;
      this.emit("close", event);
    });

    transport.on("error", (event: TransportEvent) => {
      this.emit("error", event);
    });

    transport.on("message", (message: RosbridgeMessage) => {
      this.handleMessage(message);
    });
  }

  public close() {
    this.transport?.close();
  }

  private handleMessage(message: RosbridgeMessageBase) {
    if (isRosbridgePublishMessage(message)) {
      this.emit(message.topic, message);
    } else if (isRosbridgeServiceResponseMessage(message)) {
      if (message.id) {
        this.emit(message.id, message);
      } else {
        console.error("Received service response without ID");
      }
    } else if (isRosbridgeCallServiceMessage(message)) {
      this.emit(message.service, message);
    } else if (isRosbridgeSendActionGoalMessage(message)) {
      this.emit(message.action, message);
    } else if (isRosbridgeCancelActionGoalMessage(message)) {
      this.emit(message.id, message);
    } else if (isRosbridgeActionFeedbackMessage(message)) {
      this.emit(message.id, message);
    } else if (isRosbridgeActionResultMessage(message)) {
      this.emit(message.id, message);
    } else if (isRosbridgeStatusMessage(message)) {
      if (message.id) {
        this.emit(`status:${message.id}`, message);
      } else {
        this.emit("status", message);
      }
    }
  }

  /**
   * Send an authorization request to the server.
   *
   * @param mac - MAC (hash) string given by the trusted source.
   * @param client - IP of the client.
   * @param dest - IP of the destination.
   * @param rand - Random string given by the trusted source.
   * @param t - Time of the authorization request.
   * @param level - User level as a string given by the client.
   * @param end - End time of the client's session.
   */
  public authenticate(
    mac: string,
    client: string,
    dest: string,
    rand: string,
    t: number,
    level: string,
    end: number,
  ) {
    // send the request
    this.callOnConnection({
      op: "auth",
      mac: mac,
      client: client,
      dest: dest,
      rand: rand,
      t: t,
      level: level,
      end: end,
    });
  }

  /**
   * Sends the message to the transport.
   * If not connected, queues the message to send once reconnected.
   */
  public callOnConnection(message: RosbridgeMessage) {
    if (this.isConnected) {
      this.transport?.send(message);
    } else {
      this.once("connection", () => {
        this.transport?.send(message);
      });
    }
  }

  /**
   * Send a set_level request to the server.
   *
   * @param level - Status level (none, error, warning, info).
   * @param [id] - Operation ID to change status level on.
   */
  public setStatusLevel(
    level: RosbridgeSetStatusLevelMessage["level"],
    id?: string,
  ) {
    const levelMsg: RosbridgeSetStatusLevelMessage = {
      op: "set_level",
      level,
      id,
    };
    this.callOnConnection(levelMsg);
  }

  /**
   * Retrieve a list of action servers in ROS as an array of string.
   *
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getActionServers(
    callback: (actionservers: string[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const getActionServers = new Service<
      rosapi.GetActionServersRequest,
      rosapi.GetActionServersResponse
    >({
      ros: this,
      name: "rosapi/action_servers",
      serviceType: "rosapi/GetActionServers",
    });

    const request = {};
    getActionServers.callService(
      request,
      function (result) {
        callback(result.action_servers);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve a list of topics in ROS as an array.
   *
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getTopics(
    callback: (result: rosapi.TopicsResponse) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const topicsClient = new Service<
      rosapi.TopicsRequest,
      rosapi.TopicsResponse
    >({
      ros: this,
      name: "rosapi/topics",
      serviceType: "rosapi/Topics",
    });

    const request = {};
    topicsClient.callService(
      request,
      function (result) {
        callback(result);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve a list of topics in ROS as an array of a specific type.
   *
   * @param topicType - The topic type to find.
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getTopicsForType(
    topicType: string,
    callback: (topics: string[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const topicsForTypeClient = new Service<
      rosapi.TopicsForTypeRequest,
      rosapi.TopicsForTypeResponse
    >({
      ros: this,
      name: "rosapi/topics_for_type",
      serviceType: "rosapi/TopicsForType",
    });

    const request = {
      type: topicType,
    };
    topicsForTypeClient.callService(
      request,
      function (result) {
        callback(result.topics);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve a list of active service names in ROS.
   *
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getServices(
    callback: (services: string[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const servicesClient = new Service<
      rosapi.ServicesRequest,
      rosapi.ServicesResponse
    >({
      ros: this,
      name: "rosapi/services",
      serviceType: "rosapi/Services",
    });

    const request = {};
    servicesClient.callService(
      request,
      function (result) {
        callback(result.services);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve a list of services in ROS as an array as specific type.
   *
   * @param serviceType - The service type to find.
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getServicesForType(
    serviceType: string,
    callback: (services: string[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const servicesForTypeClient = new Service<
      rosapi.ServicesForTypeRequest,
      rosapi.ServicesForTypeResponse
    >({
      ros: this,
      name: "rosapi/services_for_type",
      serviceType: "rosapi/ServicesForType",
    });

    const request = {
      type: serviceType,
    };
    servicesForTypeClient.callService(
      request,
      function (result) {
        callback(result.services);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve the details of a ROS service request.
   *
   * @param type - The type of the service.
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getServiceRequestDetails(
    type: string,
    callback: (result: rosapi.ServiceRequestDetailsResponse) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const serviceTypeClient = new Service<
      rosapi.ServiceRequestDetailsRequest,
      rosapi.ServiceRequestDetailsResponse
    >({
      ros: this,
      name: "rosapi/service_request_details",
      serviceType: "rosapi/ServiceRequestDetails",
    });
    const request = {
      type: type,
    };

    serviceTypeClient.callService(
      request,
      function (result) {
        callback(result);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve the details of a ROS service response.
   *
   * @param type - The type of the service.
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getServiceResponseDetails(
    type: string,
    callback: (result: rosapi.ServiceResponseDetailsResponse) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const serviceTypeClient = new Service<
      rosapi.ServiceResponseDetailsRequest,
      rosapi.ServiceResponseDetailsResponse
    >({
      ros: this,
      name: "rosapi/service_response_details",
      serviceType: "rosapi/ServiceResponseDetails",
    });
    const request = {
      type: type,
    };

    serviceTypeClient.callService(
      request,
      function (result) {
        callback(result);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve a list of active node names in ROS.
   *
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getNodes(
    callback: (result: string[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const nodesClient = new Service<rosapi.NodesRequest, rosapi.NodesResponse>({
      ros: this,
      name: "rosapi/nodes",
      serviceType: "rosapi/Nodes",
    });

    const request = {};
    nodesClient.callService(
      request,
      function (result) {
        callback(result.nodes);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve a list of subscribed topics, publishing topics and services of a specific node.
   *
   * @param node - Name of the node.
   */
  public getNodeDetails(
    node: string,
    callback: (result: rosapi.NodeDetailsResponse) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const nodesClient = new Service<
      rosapi.NodeDetailsRequest,
      rosapi.NodeDetailsResponse
    >({
      ros: this,
      name: "rosapi/node_details",
      serviceType: "rosapi/NodeDetails",
    });

    nodesClient.callService({ node }, callback, failedCallback);
  }

  /**
   * Retrieve a list of parameter names from the ROS Parameter Server.
   *
   * @param callback - Function with the following params:
   * @param failedCallback - The callback function when the service call failed with params:
   */
  public getParams(
    callback: (names: string[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const paramsClient = new Service<
      rosapi.GetParamNamesRequest,
      rosapi.GetParamNamesResponse
    >({
      ros: this,
      name: "rosapi/get_param_names",
      serviceType: "rosapi/GetParamNames",
    });
    const request = {};
    paramsClient.callService(
      request,
      function (result) {
        callback(result.names);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve the type of a ROS topic.
   *
   * @param topic - Name of the topic.
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getTopicType(
    topic: string,
    callback: (type: string) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const topicTypeClient = new Service<
      rosapi.TopicTypeRequest,
      rosapi.TopicTypeResponse
    >({
      ros: this,
      name: "rosapi/topic_type",
      serviceType: "rosapi/TopicType",
    });
    const request = {
      topic: topic,
    };

    topicTypeClient.callService(
      request,
      function (result) {
        callback(result.type);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve the type of a ROS service.
   *
   * @param service - Name of the service.
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getServiceType(
    service: string,
    callback: (type: string) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const serviceTypeClient = new Service<
      rosapi.ServiceTypeRequest,
      rosapi.ServiceTypeResponse
    >({
      ros: this,
      name: "rosapi/service_type",
      serviceType: "rosapi/ServiceType",
    });
    const request = {
      service: service,
    };

    serviceTypeClient.callService(
      request,
      function (result) {
        callback(result.type);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Retrieve the details of a ROS message.
   *
   * @param message - The name of the message type.
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getMessageDetails(
    message: string,
    callback: (typedefs: rosapi.TypeDef[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const messageDetailClient = new Service<
      rosapi.MessageDetailsRequest,
      rosapi.MessageDetailsResponse
    >({
      ros: this,
      name: "rosapi/message_details",
      serviceType: "rosapi/MessageDetails",
    });
    const request = {
      type: message,
    };

    messageDetailClient.callService(
      request,
      function (result) {
        callback(result.typedefs);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  /**
   * Decode a typedef array into a dictionary like `rosmsg show foo/bar`.
   *
   * @param defs - Array of type_def dictionary.
   */
  public decodeTypeDefs(defs: rosapi.TypeDef[]) {
    const decodeTypeDefsRec = (
      theType: rosapi.TypeDef,
      hints: rosapi.TypeDef[],
    ) => {
      // calls itself recursively to resolve type definition using hints.
      const typeDefDict: TypeDefDict = {};
      for (let i = 0; i < theType.fieldnames.length; i++) {
        const arrayLen = theType.fieldarraylen[i];
        const fieldName = theType.fieldnames[i];
        const fieldType = theType.fieldtypes[i];
        if (fieldName === undefined || fieldType === undefined) {
          throw new Error(
            "Received mismatched type definition vector lengths!",
          );
        }
        if (!fieldType.includes("/")) {
          // check the fieldType includes '/' or not
          if (arrayLen === -1) {
            typeDefDict[fieldName] = fieldType;
          } else {
            typeDefDict[fieldName] = [fieldType];
          }
        } else {
          // lookup the name
          let sub: rosapi.TypeDef | undefined = undefined;
          for (const hint of hints) {
            if (hint.type === fieldType) {
              sub = hint;
              break;
            }
          }
          if (sub) {
            const subResult = decodeTypeDefsRec(sub, hints);
            if (arrayLen === -1) {
              typeDefDict[fieldName] = subResult; // add this decoding result to dictionary
            } else {
              typeDefDict[fieldName] = [subResult];
            }
          } else {
            this.emit("error", `Cannot find ${fieldType} in decodeTypeDefs`);
          }
        }
      }
      return typeDefDict;
    };

    if (defs[0]) {
      return decodeTypeDefsRec(defs[0], defs);
    } else {
      return {};
    }
  }

  /**
   * @callback getTopicsAndRawTypesCallback
   * @param {Object} result - The result object with the following params:
   * @param {string[]} result.topics - Array of topic names.
   * @param {string[]} result.types - Array of message type names.
   * @param {string[]} result.typedefs_full_text - Array of full definitions of message types, similar to `gendeps --cat`.
   */
  /**
   * @callback getTopicsAndRawTypesFailedCallback
   * @param {string} error - The error message reported by ROS.
   */
  /**
   * Retrieve a list of topics and their associated type definitions.
   *
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  public getTopicsAndRawTypes(
    callback: (result: rosapi.TopicsAndRawTypesResponse) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const topicsAndRawTypesClient = new Service<
      rosapi.TopicsAndRawTypesRequest,
      rosapi.TopicsAndRawTypesResponse
    >({
      ros: this,
      name: "rosapi/topics_and_raw_types",
      serviceType: "rosapi/TopicsAndRawTypes",
    });

    const request = {};
    topicsAndRawTypesClient.callService(
      request,
      function (result) {
        callback(result);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }

  public Topic<T>(
    options: Omit<ConstructorParameters<typeof Topic<T>>[0], "ros">,
  ) {
    return new Topic<T>({ ros: this, ...options });
  }

  public Param<T>(
    options: Omit<ConstructorParameters<typeof Param<T>>[0], "ros">,
  ) {
    return new Param<T>({ ros: this, ...options });
  }

  public Service<TRequest, TResponse>(
    options: Omit<
      ConstructorParameters<typeof Service<TRequest, TResponse>>[0],
      "ros"
    >,
  ) {
    return new Service<TRequest, TResponse>({ ros: this, ...options });
  }

  public TFClient(
    options: Omit<ConstructorParameters<typeof TFClient>[0], "ros">,
  ) {
    return new TFClient({ ros: this, ...options });
  }

  public ActionClient<TGoal, TFeedback, TResult>(
    options: Omit<
      ConstructorParameters<typeof ActionClient<TGoal, TFeedback, TResult>>[0],
      "ros"
    >,
  ) {
    return new ActionClient<TGoal, TFeedback, TResult>({
      ros: this,
      ...options,
    });
  }

  public SimpleActionServer<TGoal, TFeedback, TResult>(
    options: Omit<
      ConstructorParameters<
        typeof SimpleActionServer<TGoal, TFeedback, TResult>
      >[0],
      "ros"
    >,
  ) {
    return new SimpleActionServer<TGoal, TFeedback, TResult>({
      ros: this,
      ...options,
    });
  }
}
