/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import socketAdapter from './SocketAdapter.js';

import Topic from './Topic.js';
import Service from './Service.js';
import Param from './Param.js';
import TFClient from '../tf/TFClient.js';
import ActionClient from '../actionlib/ActionClient.js';
import SimpleActionServer from '../actionlib/SimpleActionServer.js';
import { EventEmitter } from 'eventemitter3';

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
export default class Ros extends EventEmitter {
  /** @type {WebSocket | import("ws").WebSocket | null} */
  socket = null;
  idCounter = 0;
  isConnected = false;
  groovyCompatibility = true;
  /**
   * @param {Object} [options]
   * @param {string} [options.url] - The WebSocket URL for rosbridge. Can be specified later with `connect`.
   * @param {boolean} [options.groovyCompatibility=true] - Don't use interfaces that changed after the last groovy release or rosbridge_suite and related tools.
   * @param {'websocket'|RTCPeerConnection} [options.transportLibrary='websocket'] - 'websocket', or an RTCPeerConnection instance controlling how the connection is created in `connect`.
   * @param {Object} [options.transportOptions={}] - The options to use when creating a connection. Currently only used if `transportLibrary` is RTCPeerConnection.
   */
  constructor(options) {
    super();
    options = options || {};
    this.transportLibrary = options.transportLibrary || 'websocket';
    this.transportOptions = options.transportOptions || {};
    this.groovyCompatibility = options.groovyCompatibility ?? true;

    // begin by checking if a URL was given
    if (options.url) {
      this.connect(options.url);
    }
  }
  /**
   * Connect to the specified WebSocket.
   *
   * @param {string} url - WebSocket URL or RTCDataChannel label for rosbridge.
   */
  connect(url) {
    if (this.transportLibrary.constructor.name === 'RTCPeerConnection') {
      this.socket = Object.assign(
        // @ts-expect-error -- this is kinda wild. `this.transportLibrary` can either be a string or an RTCDataChannel. This needs fixing.
        this.transportLibrary.createDataChannel(url, this.transportOptions),
        socketAdapter(this)
      );
    } else if (this.transportLibrary === 'websocket') {
      // browsers, Deno, and Bun support WebSockets natively
      if (typeof WebSocket === 'function') {
        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
          const sock = new WebSocket(url);
          sock.binaryType = 'arraybuffer';
          this.socket = Object.assign(sock, socketAdapter(this));
        }
      } else {
        // if in Node.js, import ws to replace WebSocket API
        import('ws').then((ws) => {
          if (!this.socket || this.socket.readyState === ws.WebSocket.CLOSED) {
            const sock = new ws.WebSocket(url);
            sock.binaryType = 'arraybuffer'
            this.socket = Object.assign(sock, socketAdapter(this));
          }
        })
      }
    } else {
      throw 'Unknown transportLibrary: ' + this.transportLibrary.toString();
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
   * @param {string} mac - MAC (hash) string given by the trusted source.
   * @param {string} client - IP of the client.
   * @param {string} dest - IP of the destination.
   * @param {string} rand - Random string given by the trusted source.
   * @param {Object} t - Time of the authorization request.
   * @param {string} level - User level as a string given by the client.
   * @param {Object} end - End time of the client's session.
   */
  authenticate(mac, client, dest, rand, t, level, end) {
    // create the request
    var auth = {
      op: 'auth',
      mac: mac,
      client: client,
      dest: dest,
      rand: rand,
      t: t,
      level: level,
      end: end
    };
    // send the request
    this.callOnConnection(auth);
  }
  /**
   * Send an encoded message over the WebSocket.
   *
   * @param {Object} messageEncoded - The encoded message to be sent.
   */
  sendEncodedMessage(messageEncoded) {
    if (!this.isConnected) {
      this.once('connection', () => {
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
   * @param {Object} message - The message to be sent.
   */
  callOnConnection(message) {
    if (this.transportOptions.encoder) {
      this.transportOptions.encoder(message, this.sendEncodedMessage);
    } else {
      this.sendEncodedMessage(JSON.stringify(message));
    }
  }
  /**
   * Send a set_level request to the server.
   *
   * @param {string} level - Status level (none, error, warning, info).
   * @param {number} [id] - Operation ID to change status level on.
   */
  setStatusLevel(level, id) {
    var levelMsg = {
      op: 'set_level',
      level: level,
      id: id
    };

    this.callOnConnection(levelMsg);
  }
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
  getActionServers(callback, failedCallback) {
    /** @satisfies {Service<any, any>} */
    var getActionServers = new Service({
      ros: this,
      name: 'rosapi/action_servers',
      serviceType: 'rosapi/GetActionServers'
    });

    var request = {};
    if (typeof failedCallback === 'function') {
      getActionServers.callService(
        request,
        function (result) {
          callback(result.action_servers);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      getActionServers.callService(request, function (result) {
        callback(result.action_servers);
      });
    }
  }
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
  getTopics(callback, failedCallback) {
    var topicsClient = new Service({
      ros: this,
      name: 'rosapi/topics',
      serviceType: 'rosapi/Topics'
    });

    var request = {};
    if (typeof failedCallback === 'function') {
      topicsClient.callService(
        request,
        function (result) {
          callback(result);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      topicsClient.callService(request, function (result) {
        callback(result);
      });
    }
  }
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
  getTopicsForType(topicType, callback, failedCallback) {
    var topicsForTypeClient = new Service({
      ros: this,
      name: 'rosapi/topics_for_type',
      serviceType: 'rosapi/TopicsForType'
    });

    var request = {
      type: topicType
    };
    if (typeof failedCallback === 'function') {
      topicsForTypeClient.callService(
        request,
        function (result) {
          callback(result.topics);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      topicsForTypeClient.callService(request, function (result) {
        callback(result.topics);
      });
    }
  }
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
  getServices(callback, failedCallback) {
    var servicesClient = new Service({
      ros: this,
      name: 'rosapi/services',
      serviceType: 'rosapi/Services'
    });

    var request = {};
    if (typeof failedCallback === 'function') {
      servicesClient.callService(
        request,
        function (result) {
          callback(result.services);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      servicesClient.callService(request, function (result) {
        callback(result.services);
      });
    }
  }
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
  getServicesForType(serviceType, callback, failedCallback) {
    var servicesForTypeClient = new Service({
      ros: this,
      name: 'rosapi/services_for_type',
      serviceType: 'rosapi/ServicesForType'
    });

    var request = {
      type: serviceType
    };
    if (typeof failedCallback === 'function') {
      servicesForTypeClient.callService(
        request,
        function (result) {
          callback(result.services);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      servicesForTypeClient.callService(request, function (result) {
        callback(result.services);
      });
    }
  }
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
  getServiceRequestDetails(type, callback, failedCallback) {
    var serviceTypeClient = new Service({
      ros: this,
      name: 'rosapi/service_request_details',
      serviceType: 'rosapi/ServiceRequestDetails'
    });
    var request = {
      type: type
    };

    if (typeof failedCallback === 'function') {
      serviceTypeClient.callService(
        request,
        function (result) {
          callback(result);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      serviceTypeClient.callService(request, function (result) {
        callback(result);
      });
    }
  }
  /**
   * @callback getServiceResponseDetailsCallback
   * @param {{typedefs: string[]}} result - The result object with the following params:
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
  getServiceResponseDetails(type, callback, failedCallback) {
    /** @satisfies {Service<{},{typedefs: string[]}>} */
    var serviceTypeClient = new Service({
      ros: this,
      name: 'rosapi/service_response_details',
      serviceType: 'rosapi/ServiceResponseDetails'
    });
    var request = {
      type: type
    };

    if (typeof failedCallback === 'function') {
      serviceTypeClient.callService(
        request,
        function (result) {
          callback(result);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      serviceTypeClient.callService(request, function (result) {
        callback(result);
      });
    }
  }
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
  getNodes(callback, failedCallback) {
    var nodesClient = new Service({
      ros: this,
      name: 'rosapi/nodes',
      serviceType: 'rosapi/Nodes'
    });

    var request = {};
    if (typeof failedCallback === 'function') {
      nodesClient.callService(
        request,
        function (result) {
          callback(result.nodes);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      nodesClient.callService(request, function (result) {
        callback(result.nodes);
      });
    }
  }
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
  getNodeDetails(node, callback, failedCallback) {
    var nodesClient = new Service({
      ros: this,
      name: 'rosapi/node_details',
      serviceType: 'rosapi/NodeDetails'
    });

    var request = {
      node: node
    };
    if (typeof failedCallback === 'function') {
      nodesClient.callService(
        request,
        function (result) {
          callback(result.subscribing, result.publishing, result.services);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      nodesClient.callService(request, function (result) {
        // @ts-expect-error -- callback parameter polymorphism, see JSDoc comment above
        callback(result);
      });
    }
  }
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
  getParams(callback, failedCallback) {
    var paramsClient = new Service({
      ros: this,
      name: 'rosapi/get_param_names',
      serviceType: 'rosapi/GetParamNames'
    });
    var request = {};
    if (typeof failedCallback === 'function') {
      paramsClient.callService(
        request,
        function (result) {
          callback(result.names);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      paramsClient.callService(request, function (result) {
        callback(result.names);
      });
    }
  }
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
  getTopicType(topic, callback, failedCallback) {
    var topicTypeClient = new Service({
      ros: this,
      name: 'rosapi/topic_type',
      serviceType: 'rosapi/TopicType'
    });
    var request = {
      topic: topic
    };

    if (typeof failedCallback === 'function') {
      topicTypeClient.callService(
        request,
        function (result) {
          callback(result.type);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      topicTypeClient.callService(request, function (result) {
        callback(result.type);
      });
    }
  }
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
  getServiceType(service, callback, failedCallback) {
    var serviceTypeClient = new Service({
      ros: this,
      name: 'rosapi/service_type',
      serviceType: 'rosapi/ServiceType'
    });
    var request = {
      service: service
    };

    if (typeof failedCallback === 'function') {
      serviceTypeClient.callService(
        request,
        function (result) {
          callback(result.type);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      serviceTypeClient.callService(request, function (result) {
        callback(result.type);
      });
    }
  }
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
  getMessageDetails(message, callback, failedCallback) {
    var messageDetailClient = new Service({
      ros: this,
      name: 'rosapi/message_details',
      serviceType: 'rosapi/MessageDetails'
    });
    var request = {
      type: message
    };

    if (typeof failedCallback === 'function') {
      messageDetailClient.callService(
        request,
        function (result) {
          callback(result.typedefs);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      messageDetailClient.callService(request, function (result) {
        callback(result.typedefs);
      });
    }
  }
  /**
   * Decode a typedef array into a dictionary like `rosmsg show foo/bar`.
   *
   * @param {Object[]} defs - Array of type_def dictionary.
   */
  decodeTypeDefs(defs) {
    var decodeTypeDefsRec = (theType, hints) => {
      // calls itself recursively to resolve type definition using hints.
      var typeDefDict = {};
      for (var i = 0; i < theType.fieldnames.length; i++) {
        var arrayLen = theType.fieldarraylen[i];
        var fieldName = theType.fieldnames[i];
        var fieldType = theType.fieldtypes[i];
        if (fieldType.indexOf('/') === -1) {
          // check the fieldType includes '/' or not
          if (arrayLen === -1) {
            typeDefDict[fieldName] = fieldType;
          } else {
            typeDefDict[fieldName] = [fieldType];
          }
        } else {
          // lookup the name
          var sub = false;
          for (var j = 0; j < hints.length; j++) {
            if (hints[j].type.toString() === fieldType.toString()) {
              sub = hints[j];
              break;
            }
          }
          if (sub) {
            var subResult = decodeTypeDefsRec(sub, hints);
            if (arrayLen === -1) {
              typeDefDict[fieldName] = subResult; // add this decoding result to dictionary
            } else {
              typeDefDict[fieldName] = [subResult];
            }
          } else {
            this.emit(
              'error',
              'Cannot find ' + fieldType + ' in decodeTypeDefs'
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
   * @param {getTopicsAndRawTypesCallback} callback - Function with the following params:
   * @param {getTopicsAndRawTypesFailedCallback} [failedCallback] - The callback function when the service call failed with params:
   */
  getTopicsAndRawTypes(callback, failedCallback) {
    var topicsAndRawTypesClient = new Service({
      ros: this,
      name: 'rosapi/topics_and_raw_types',
      serviceType: 'rosapi/TopicsAndRawTypes'
    });

    var request = {};
    if (typeof failedCallback === 'function') {
      topicsAndRawTypesClient.callService(
        request,
        function (result) {
          callback(result);
        },
        function (message) {
          failedCallback(message);
        }
      );
    } else {
      topicsAndRawTypesClient.callService(request, function (result) {
        callback(result);
      });
    }
  }
  Topic(options) {
    return new Topic({ ros: this, ...options });
  }
  Param(options) {
    return new Param({ ros: this, ...options });
  }
  Service(options) {
    return new Service({ ros: this, ...options });
  }
  TFClient(options) {
    return new TFClient({ ros: this, ...options });
  }
  ActionClient(options) {
    return new ActionClient({ ros: this, ...options });
  }
  SimpleActionServer(options) {
    return new SimpleActionServer({ ros: this, ...options });
  }
}
