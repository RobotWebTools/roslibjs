/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import socketAdapter from "./SocketAdapter.js";
import {
  isRosbridgeActionFeedbackMessage,
  isRosbridgeActionResultMessage,
  isRosbridgeCallServiceMessage,
  isRosbridgeCancelActionGoalMessage,
  isRosbridgePublishMessage,
  isRosbridgeSendActionGoalMessage,
  isRosbridgeServiceResponseMessage,
  isRosbridgeStatusMessage,
  RosbridgeMessage,
} from "../types/protocol.js";

import Topic from "./Topic.js";
import Service from "./Service.js";
import Param from "./Param.js";
import TFClient from "../tf/TFClient";
import ActionClient from "../actionlib/ActionClient.js";
import SimpleActionServer from "../actionlib/SimpleActionServer.js";
import { EventEmitter } from "eventemitter3";
import { rosapi } from "../types/rosapi.ts";

function isRTCPeerDataChannel(obj: unknown): obj is RTCPeerConnection {
  return obj?.constructor.name === "RTCDataChannel";
}

/**
 * Manages connection to the server and all interactions with ROS.
 *
 * Emits the following events:
 *  * 'error' - There was an error with ROS.
 *  * 'connection' - Connected to the WebSocket server.
 *  * 'close' - Disconnected to the WebSocket server.
 *  * &#60;topicName&#62; - A message came from rosbridge with the given topic name.
 *  * &#60;serviceID&#62; - A service response came from rosbridge with the given ID.
 */
export default class Ros extends EventEmitter<
  {
    error: [string];
    connection: [Event];
    close: [Event];
    // Any dynamically-named event should correspond to a rosbridge protocol message
  } & Record<string, [RosbridgeMessage]>
> {
  /** @type {import('./SocketAdapter.js').default | null} */
  socket: import("./SocketAdapter.js").default | null = null;
  idCounter = 0;
  isConnected = false;
  transportLibrary: "websocket" | RTCPeerConnection;
  transportOptions: {
    decoder?: (message: unknown) => unknown;
    encoder?: (
      message: unknown,
      callback: (encodedMessage: string) => void,
    ) => unknown;
  };
  /**
   * @param [options]
   * @param [options.url] - The WebSocket URL for rosbridge. Can be specified later with `connect`.
   * @param [options.transportLibrary='websocket'] - 'websocket', or an RTCPeerConnection instance controlling how the connection is created in `connect`.
   * @param [options.transportOptions={}] - The options to use when creating a connection. Currently only used if `transportLibrary` is RTCPeerConnection.
   */
  constructor({
    url,
    transportLibrary = "websocket",
    transportOptions = {},
  }: {
    url?: string;
    transportLibrary?: "websocket" | RTCPeerConnection;
    transportOptions?: object;
  } = {}) {
    super();

    this.transportLibrary = transportLibrary;
    this.transportOptions = transportOptions;

    // begin by checking if a URL was given
    if (url) {
      this.connect(url).catch(console.error);
    }
  }
  /**
   * Create the appropriate transport based on transport library configuration
   * @param url - WebSocket URL or RTCDataChannel label for rosbridge.
   * @returns The created transport
   */
  async #createTransport(
    url: string,
  ): Promise<WebSocket | RTCDataChannel | import("ws").WebSocket | null> {
    if (isRTCPeerDataChannel(this.transportLibrary)) {
      const dataChannel = this.transportLibrary.createDataChannel(
        url,
        // @ts-expect-error -- why are the options for an RTC channel conflated with the options for roslibjs's bespoke socket adapter??
        this.transportOptions,
      );
      return dataChannel;
    } else {
      // browsers, Deno, and Bun support WebSockets natively
      if (typeof WebSocket === "function") {
        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
          const sock = new WebSocket(url);
          sock.binaryType = "arraybuffer";
          return sock;
        }
        return null; // Already connected
      } else {
        // if in Node.js, import ws to replace WebSocket API
        const ws = await import("ws");
        if (!this.socket || this.socket.readyState === ws.WebSocket.CLOSED) {
          const sock = new ws.WebSocket(url);
          sock.binaryType = "arraybuffer";
          return sock;
        }
        return null; // Already connected
      }
    }
  }

  /**
   * @param url - WebSocket URL or RTCDataChannel label for rosbridge.
   */
  async connect(url: string) {
    const transport = await this.#createTransport(url);

    if (!transport) {
      return; // Already connected
    }

    this.socket = new socketAdapter(transport, {
      onOpen: (event) => {
        this.isConnected = true;
        this.emit("connection", event);
      },
      onClose: (event) => {
        this.isConnected = false;
        this.emit("close", event);
      },
      onError: (event) => {
        this.emit("error", String(event.error));
      },
      onMessage: (message) => {
        this.#handleMessage(message);
      },
      decoder: this.transportOptions.decoder,
    });
  }

  /**
   * Handle processed messages from SocketAdapter
   * @param message
   */
  #handleMessage(message: RosbridgeMessage) {
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
        this.emit("status:" + message.id, message);
      } else {
        this.emit("status", message);
      }
    }
  }
  /**
   * Disconnect from the WebSocket server.
   */
  close() {
    if (this.socket) {
      this.socket.close();
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
  authenticate(
    mac: string,
    client: string,
    dest: string,
    rand: string,
    t: object,
    level: string,
    end: object,
  ) {
    // create the request
    const auth = {
      op: "auth",
      mac: mac,
      client: client,
      dest: dest,
      rand: rand,
      t: t,
      level: level,
      end: end,
    };
    // send the request
    this.callOnConnection(auth);
  }
  /**
   * Send an encoded message over the WebSocket.
   *
   * @param messageEncoded - The encoded message to be sent.
   */
  sendEncodedMessage(messageEncoded: string) {
    if (!this.isConnected) {
      this.once("connection", () => {
        if (this.socket !== null) {
          this.socket.send(messageEncoded);
        }
      });
    } else {
      if (this.socket !== null) {
        this.socket.send(messageEncoded);
      }
    }
  }
  /**
   * Send the message over the WebSocket, but queue the message up if not yet
   * connected.
   *
   * @param message - The message to be sent.
   */
  callOnConnection = <TMessage extends RosbridgeMessage>(message: TMessage) => {
    if (this.transportOptions.encoder) {
      this.transportOptions.encoder(message, (msg) =>
        this.sendEncodedMessage(msg),
      );
    } else {
      this.sendEncodedMessage(JSON.stringify(message));
    }
  };
  /**
   * Send a set_level request to the server.
   *
   * @param level - Status level (none, error, warning, info).
   * @param [id] - Operation ID to change status level on.
   */
  setStatusLevel(level: string, id?: number) {
    const levelMsg = {
      op: "set_level",
      level: level,
      id: id,
    };

    this.callOnConnection(levelMsg);
  }
  /**
   * Retrieve a list of action servers in ROS as an array of string.
   *
   * @param callback - Function with the following params:
   * @param [failedCallback] - The callback function when the service call failed with params:
   */
  getActionServers(
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
  getTopics(
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
  getTopicsForType(
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
  getServices(
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
  getServicesForType(
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
  getServiceRequestDetails(
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
  getServiceResponseDetails(
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
  getNodes(
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
  getNodeDetails(
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
  getParams(
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
  getTopicType(
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
  getServiceType(
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
  getMessageDetails(
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
  decodeTypeDefs(defs: rosapi.TypeDef[]) {
    const decodeTypeDefsRec = (
      theType: rosapi.TypeDef,
      hints: rosapi.TypeDef[],
    ) => {
      // calls itself recursively to resolve type definition using hints.
      const typeDefDict = {};
      for (let i = 0; i < theType.fieldnames.length; i++) {
        const arrayLen = theType.fieldarraylen[i];
        const fieldName = theType.fieldnames[i];
        const fieldType = theType.fieldtypes[i];
        if (!fieldType.includes("/")) {
          // check the fieldType includes '/' or not
          if (arrayLen === -1) {
            typeDefDict[fieldName] = fieldType;
          } else {
            typeDefDict[fieldName] = [fieldType];
          }
        } else {
          // lookup the name
          let sub: boolean | rosapi.TypeDef = false;
          for (const hint of hints) {
            if (hint.type.toString() === fieldType.toString()) {
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
            this.emit(
              "error",
              "Cannot find " + fieldType + " in decodeTypeDefs",
            );
          }
        }
      }
      return typeDefDict;
    };

    return decodeTypeDefsRec(defs[0], defs);
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
  getTopicsAndRawTypes(
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
  Topic<T>(options: Omit<ConstructorParameters<typeof Topic<T>>[0], "ros">) {
    return new Topic<T>({ ros: this, ...options });
  }
  Param<T>(options: Omit<ConstructorParameters<typeof Param<T>>[0], "ros">) {
    return new Param<T>({ ros: this, ...options });
  }
  Service<TRequest, TResponse>(
    options: Omit<
      ConstructorParameters<typeof Service<TRequest, TResponse>>[0],
      "ros"
    >,
  ) {
    return new Service<TRequest, TResponse>({ ros: this, ...options });
  }
  TFClient(options: Omit<ConstructorParameters<typeof TFClient>[0], "ros">) {
    return new TFClient({ ros: this, ...options });
  }
  ActionClient<TGoal, TFeedback, TResult>(
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
  SimpleActionServer<TGoal, TFeedback, TResult>(
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
