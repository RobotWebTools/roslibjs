export = Ros;
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
declare class Ros extends EventEmitter2 {
    /**
     * @param {Object} [options]
     * @param {string} [options.url] - The WebSocket URL for rosbridge or the node server URL to connect using socket.io (if socket.io exists in the page). Can be specified later with `connect`.
     * @param {boolean} [options.groovyCompatibility=true] - Don't use interfaces that changed after the last groovy release or rosbridge_suite and related tools.
     * @param {string} [options.transportLibrary=websocket] - One of 'websocket', 'workersocket', 'socket.io' or RTCPeerConnection instance controlling how the connection is created in `connect`.
     * @param {Object} [options.transportOptions={}] - The options to use when creating a connection. Currently only used if `transportLibrary` is RTCPeerConnection.
     */
    constructor(options?: {
        url?: string | undefined;
        groovyCompatibility?: boolean | undefined;
        transportLibrary?: string | undefined;
        transportOptions?: any;
    } | undefined);
    socket: any;
    idCounter: number;
    isConnected: boolean;
    transportLibrary: string;
    transportOptions: any;
    _sendFunc: (msg: any) => void;
    groovyCompatibility: boolean;
    /**
     * Connect to the specified WebSocket.
     *
     * @param {string} url - WebSocket URL or RTCDataChannel label for rosbridge.
     */
    connect(url: string): void;
    /**
     * Disconnect from the WebSocket server.
     */
    close(): void;
    /**
     * Send an authorization request to the server.
     *
     * @param {string} mac - MAC (hash) string given by the trusted source.
     * @param {string} client - IP of the client.
     * @param {string} dest - IP of the destination.
     * @param {string} rand - Random string given by the trusted source.
     * @param {Object} t - Time of the authorization request.
     * @param {string} level - User level as a string given by the client.
     * @param {Object} end - End time of the client's session.
     */
    authenticate(mac: string, client: string, dest: string, rand: string, t: any, level: string, end: any): void;
    /**
     * Send an encoded message over the WebSocket.
     *
     * @param {Object} messageEncoded - The encoded message to be sent.
     */
    sendEncodedMessage(messageEncoded: any): void;
    /**
     * Send the message over the WebSocket, but queue the message up if not yet
     * connected.
     *
     * @param {Object} message - The message to be sent.
     */
    callOnConnection(message: any): void;
    /**
     * Send a set_level request to the server.
     *
     * @param {string} level - Status level (none, error, warning, info).
     * @param {number} [id] - Operation ID to change status level on.
     */
    setStatusLevel(level: string, id?: number | undefined): void;
    /**
     * @callback getActionServersCallback
     * @param {string[]} actionservers - Array of action server names.
     */
    /**
     * @callback getActionServersFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve a list of action servers in ROS as an array of string.
     *
     * @param {getActionServersCallback} callback - Function with the following params:
     * @param {getActionServersFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getActionServers(callback: (actionservers: string[]) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getTopicsCallback
     * @param {Object} result - The result object with the following params:
     * @param {string[]} result.topics - Array of topic names.
     * @param {string[]} result.types - Array of message type names.
     */
    /**
     * @callback getTopicsFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve a list of topics in ROS as an array.
     *
     * @param {getTopicsCallback} callback - Function with the following params:
     * @param {getTopicsFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getTopics(callback: (result: {
        topics: string[];
        types: string[];
    }) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getTopicsForTypeCallback
     * @param {string[]} topics - Array of topic names.
     */
    /**
     * @callback getTopicsForTypeFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve a list of topics in ROS as an array of a specific type.
     *
     * @param {string} topicType - The topic type to find.
     * @param {getTopicsForTypeCallback} callback - Function with the following params:
     * @param {getTopicsForTypeFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getTopicsForType(topicType: string, callback: (topics: string[]) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getServicesCallback
     * @param {string[]} services - Array of service names.
     */
    /**
     * @callback getServicesFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve a list of active service names in ROS.
     *
     * @param {getServicesCallback} callback - Function with the following params:
     * @param {getServicesFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getServices(callback: (services: string[]) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getServicesForTypeCallback
     * @param {string[]} topics - Array of service names.
     */
    /**
     * @callback getServicesForTypeFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve a list of services in ROS as an array as specific type.
     *
     * @param {string} serviceType - The service type to find.
     * @param {getServicesForTypeCallback} callback - Function with the following params:
     * @param {getServicesForTypeFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getServicesForType(serviceType: string, callback: (topics: string[]) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getServiceRequestDetailsCallback
     * @param {Object} result - The result object with the following params:
     * @param {string[]} result.typedefs - An array containing the details of the service request.
     */
    /**
     * @callback getServiceRequestDetailsFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve the details of a ROS service request.
     *
     * @param {string} type - The type of the service.
     * @param {getServiceRequestDetailsCallback} callback - Function with the following params:
     * @param {getServiceRequestDetailsFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getServiceRequestDetails(type: string, callback: (result: {
        typedefs: string[];
    }) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getServiceResponseDetailsCallback
     * @param {Object} result - The result object with the following params:
     * @param {string[]} result.typedefs - An array containing the details of the service response.
     */
    /**
     * @callback getServiceResponseDetailsFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve the details of a ROS service response.
     *
     * @param {string} type - The type of the service.
     * @param {getServiceResponseDetailsCallback} callback - Function with the following params:
     * @param {getServiceResponseDetailsFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getServiceResponseDetails(type: string, callback: (result: {
        typedefs: string[];
    }) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getNodesCallback
     * @param {string[]} nodes - Array of node names.
     */
    /**
     * @callback getNodesFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve a list of active node names in ROS.
     *
     * @param {getNodesCallback} callback - Function with the following params:
     * @param {getNodesFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getNodes(callback: (nodes: string[]) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getNodeDetailsCallback
     * @param {string[]} subscriptions - Array of subscribed topic names.
     * @param {string[]} publications - Array of published topic names.
     * @param {string[]} services - Array of service names hosted.
     */
    /**
     * @callback getNodeDetailsFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * @callback getNodeDetailsLegacyCallback
     * @param {Object} result - The result object with the following params:
     * @param {string[]} result.subscribing - Array of subscribed topic names.
     * @param {string[]} result.publishing - Array of published topic names.
     * @param {string[]} result.services - Array of service names hosted.
     */
    /**
     * Retrieve a list of subscribed topics, publishing topics and services of a specific node.
     * <br>
     * These are the parameters if failedCallback is <strong>defined</strong>.
     *
     * @param {string} node - Name of the node.
     * @param {getNodeDetailsCallback} callback - Function with the following params:
     * @param {getNodeDetailsFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     *
     * @also
     *
     * Retrieve a list of subscribed topics, publishing topics and services of a specific node.
     * <br>
     * These are the parameters if failedCallback is <strong>undefined</strong>.
     *
     * @param {string} node - Name of the node.
     * @param {getNodeDetailsLegacyCallback} callback - Function with the following params:
     * @param {getNodeDetailsFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getNodeDetails(node: string, callback: (subscriptions: string[], publications: string[], services: string[]) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getParamsCallback
     * @param {string[]} params - Array of param names.
     */
    /**
     * @callback getParamsFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve a list of parameter names from the ROS Parameter Server.
     *
     * @param {getParamsCallback} callback - Function with the following params:
     * @param {getParamsFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getParams(callback: (params: string[]) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getTopicTypeCallback
     * @param {string} type - The type of the topic.
     */
    /**
     * @callback getTopicTypeFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve the type of a ROS topic.
     *
     * @param {string} topic - Name of the topic.
     * @param {getTopicTypeCallback} callback - Function with the following params:
     * @param {getTopicTypeFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getTopicType(topic: string, callback: (type: string) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getServiceTypeCallback
     * @param {string} type - The type of the service.
     */
    /**
     * @callback getServiceTypeFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve the type of a ROS service.
     *
     * @param {string} service - Name of the service.
     * @param {getServiceTypeCallback} callback - Function with the following params:
     * @param {getServiceTypeFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getServiceType(service: string, callback: (type: string) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * @callback getMessageDetailsCallback
     * @param {string} details - An array of the message details.
     */
    /**
     * @callback getMessageDetailsFailedCallback
     * @param {string} error - The error message reported by ROS.
     */
    /**
     * Retrieve the details of a ROS message.
     *
     * @param {string} message - The name of the message type.
     * @param {getMessageDetailsCallback} callback - Function with the following params:
     * @param {getMessageDetailsFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getMessageDetails(message: string, callback: (details: string) => any, failedCallback?: ((error: string) => any) | undefined): void;
    /**
     * Decode a typedef array into a dictionary like `rosmsg show foo/bar`.
     *
     * @param {Object[]} defs - Array of type_def dictionary.
     */
    decodeTypeDefs(defs: any[]): {};
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
     * @param {getTopicsAndRawTypesCallback} callback - Function with the following params:
     * @param {getTopicsAndRawTypesFailedCallback} [failedCallback] - The callback function when the service call failed with params:
     */
    getTopicsAndRawTypes(callback: (result: {
        topics: string[];
        types: string[];
        typedefs_full_text: string[];
    }) => any, failedCallback?: ((error: string) => any) | undefined): void;
    Topic(options: any): Topic;
    Param(options: any): Param;
    Service(options: any): Service;
    TFClient(options: any): import("../tf/TFClient");
    ActionClient(options: any): import("../actionlib/ActionClient");
    SimpleActionServer(options: any): import("../actionlib/SimpleActionServer");
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import Topic = require("./Topic");
import Param = require("./Param");
import Service = require("./Service");
