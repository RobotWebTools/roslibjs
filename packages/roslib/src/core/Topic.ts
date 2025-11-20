/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import { EventEmitter } from "eventemitter3";
import Service from "./Service.ts";
import type Ros from "./Ros.ts";
import {
  isRosbridgePublishMessage,
  type RosbridgeAdvertiseMessage,
  type RosbridgeMessage,
  type RosbridgeSubscribeMessage,
} from "../types/protocol.ts";
import type { rosapi } from "../types/rosapi.ts";
import { v4 as uuidv4 } from "uuid";

/**
 * Publish and/or subscribe to a topic in ROS.
 *
 * Emits the following events:
 *  * 'warning' - If there are any warning during the Topic creation.
 *  * 'message' - The message data from rosbridge.
 */
export default class Topic<T> extends EventEmitter<{
  message: [T];
  warning: [string];
  unsubscribe: undefined;
  unadvertise: undefined;
}> {
  waitForReconnect = false;
  reconnectFunc: (() => void) | undefined = undefined;
  isAdvertised = false;
  ros: Ros;
  name: string;
  messageType: string;
  compression: string;
  throttle_rate: number;
  latch: boolean;
  queue_size: number;
  queue_length: number;
  reconnect_on_close: boolean;
  callForSubscribeAndAdvertise: (
    message: RosbridgeSubscribeMessage | RosbridgeAdvertiseMessage,
  ) => void;
  subscribeId: string | null = null;
  advertiseId?: string;
  /**
   * @param options
   * @param options.ros - The ROSLIB.Ros connection handle.
   * @param options.name - The topic name, like '/cmd_vel'.
   * @param options.messageType - The message type, like 'std_msgs/String'.
   * @param [options.compression=none] - The type of compression to use, like 'png', 'cbor', or 'cbor-raw'.
   * @param [options.throttle_rate=0] - The rate (in ms in between messages) at which to throttle the topics.
   * @param [options.queue_size=100] - The queue created at bridge side for re-publishing webtopics.
   * @param [options.latch=false] - Latch the topic when publishing.
   * @param [options.queue_length=0] - The queue length at bridge side used when subscribing.
   * @param [options.reconnect_on_close=true] - The flag to enable resubscription and readvertisement on close event.
   */
  constructor({
    ros,
    name,
    messageType,
    compression = "none",
    throttle_rate = 0,
    latch = false,
    queue_size = 100,
    queue_length = 0,
    reconnect_on_close = true,
  }: {
    ros: Ros;
    name: string;
    messageType: string;
    compression?: string;
    throttle_rate?: number;
    queue_size?: number;
    latch?: boolean;
    queue_length?: number;
    reconnect_on_close?: boolean;
  }) {
    super();

    this.ros = ros;
    this.name = name;
    this.messageType = messageType;
    this.compression = compression;
    this.throttle_rate = throttle_rate;
    this.latch = latch;
    this.queue_size = queue_size;
    this.queue_length = queue_length;
    this.reconnect_on_close = reconnect_on_close;

    // Check for valid compression types
    if (
      this.compression &&
      this.compression !== "png" &&
      this.compression !== "cbor" &&
      this.compression !== "cbor-raw" &&
      this.compression !== "none"
    ) {
      this.emit(
        "warning",
        `${
          this.compression
        } compression is not supported. No compression will be used.`,
      );
      this.compression = "none";
    }

    // Check if throttle rate is negative
    if (this.throttle_rate < 0) {
      this.emit(
        "warning",
        `${this.throttle_rate.toString()} is not allowed. Set to 0`,
      );
      this.throttle_rate = 0;
    }

    if (this.reconnect_on_close) {
      this.callForSubscribeAndAdvertise = (message) => {
        this.ros.callOnConnection(message);

        this.waitForReconnect = false;
        this.reconnectFunc = () => {
          if (!this.waitForReconnect) {
            this.waitForReconnect = true;
            this.ros.callOnConnection(message);
            this.ros.once("connection", () => {
              this.waitForReconnect = false;
            });
          }
        };
        this.ros.on("close", this.reconnectFunc);
      };
    } else {
      this.callForSubscribeAndAdvertise = (msg) => {
        this.ros.callOnConnection(msg);
      };
    }
  }

  #messageCallback = (data: RosbridgeMessage) => {
    if (isRosbridgePublishMessage<T>(data)) {
      this.emit("message", data.msg);
    } else {
      throw new Error(
        `Unexpected message on topic channel: ${JSON.stringify(data)}`,
      );
    }
  };
  /**
   * Every time a message is published for the given topic, the callback
   * will be called with the message object.
   *
   * @param callback - Function with the following params:
   */
  subscribe(callback: (message: T) => void) {
    this.on("message", callback);

    if (this.subscribeId) {
      return;
    }
    this.ros.on(this.name, this.#messageCallback);
    this.subscribeId = `subscribe:${this.name}:${uuidv4()}`;

    this.callForSubscribeAndAdvertise({
      op: "subscribe",
      id: this.subscribeId,
      type: this.messageType,
      topic: this.name,
      compression: this.compression,
      throttle_rate: this.throttle_rate,
      queue_length: this.queue_length,
    });
  }
  /**
   * Unregister as a subscriber for the topic. Unsubscribing will stop
   * and remove all subscribe callbacks. To remove a callback, you must
   * explicitly pass the callback function in.
   *
   * @param [callback] - The callback to unregister, if
   *     provided and other listeners are registered the topic won't
   *     unsubscribe, just stop emitting to the passed listener.
   */
  unsubscribe(callback?: Parameters<EventEmitter["off"]>[1]) {
    if (callback) {
      this.off("message", callback);
      // If there is any other callbacks still subscribed don't unsubscribe
      if (this.listeners("message").length) {
        return;
      }
    }
    if (!this.subscribeId) {
      return;
    }
    // Note: Don't call this.removeAllListeners, allow client to handle that themselves
    this.ros.off(this.name, this.#messageCallback);
    if (this.reconnect_on_close) {
      this.ros.off("close", this.reconnectFunc);
    }
    this.emit("unsubscribe");
    this.ros.callOnConnection({
      op: "unsubscribe",
      id: this.subscribeId,
      topic: this.name,
    });
    this.subscribeId = null;
  }
  /**
   * Register as a publisher for the topic.
   */
  advertise() {
    if (this.isAdvertised) {
      return;
    }
    this.advertiseId = `advertise:${this.name}:${uuidv4()}`;
    this.callForSubscribeAndAdvertise({
      op: "advertise",
      id: this.advertiseId,
      type: this.messageType,
      topic: this.name,
      latch: this.latch,
      queue_size: this.queue_size,
    });
    this.isAdvertised = true;

    if (!this.reconnect_on_close) {
      this.ros.on("close", () => {
        this.isAdvertised = false;
      });
    }
  }
  /**
   * Unregister as a publisher for the topic.
   */
  unadvertise() {
    if (!this.isAdvertised) {
      return;
    }
    if (this.reconnect_on_close) {
      this.ros.off("close", this.reconnectFunc);
    }
    this.emit("unadvertise");
    this.ros.callOnConnection({
      op: "unadvertise",
      id: this.advertiseId,
      topic: this.name,
    });
    this.isAdvertised = false;
  }
  /**
   * Publish the message.
   *
   * @param message - The message to publish.
   */
  publish(message: T) {
    if (!this.isAdvertised) {
      this.advertise();
    }

    this.ros.callOnConnection({
      op: "publish",
      id: `publish:${this.name}:${uuidv4()}`,
      topic: this.name,
      msg: message,
    });
  }

  /**
   * Retrieves list of publishers for this topic.
   *
   * @param callback - Function with the following params:
   *   * publishers - The list of publishers.
   * @param [failedCallback] - The callback function when the service call failed.
   */
  getPublishers(
    callback: (publishers: string[]) => void,
    failedCallback: (error: string) => void = console.error,
  ) {
    const publishersClient = new Service<
      rosapi.PublishersRequest,
      rosapi.PublishersResponse
    >({
      ros: this.ros,
      name: "/rosapi/publishers",
      serviceType: "rosapi/Publishers",
    });

    const request = {
      topic: this.name,
    };
    publishersClient.callService(
      request,
      function (result) {
        callback(result.publishers);
      },
      function (message) {
        failedCallback(message);
      },
    );
  }
}
