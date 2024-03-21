/**
 * @fileOverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

import { EventEmitter } from 'eventemitter3';
import Ros from './Ros.js';

/**
 * Publish and/or subscribe to a topic in ROS.
 *
 * Emits the following events:
 *  * 'warning' - If there are any warning during the Topic creation.
 *  * 'message' - The message data from rosbridge.
 * @template T
 */
export default class Topic extends EventEmitter {
  /** @type {boolean | undefined} */
  waitForReconnect = undefined;
  /** @type {(() => void) | undefined} */
  reconnectFunc = undefined;
  isAdvertised = false;
  /**
   * @param {Object} options
   * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} options.name - The topic name, like '/cmd_vel'.
   * @param {string} options.messageType - The message type, like 'std_msgs/String'.
   * @param {string} [options.compression=none] - The type of compression to use, like 'png', 'cbor', or 'cbor-raw'.
   * @param {number} [options.throttle_rate=0] - The rate (in ms in between messages) at which to throttle the topics.
   * @param {number} [options.queue_size=100] - The queue created at bridge side for re-publishing webtopics.
   * @param {boolean} [options.latch=false] - Latch the topic when publishing.
   * @param {number} [options.queue_length=0] - The queue length at bridge side used when subscribing.
   * @param {boolean} [options.reconnect_on_close=true] - The flag to enable resubscription and readvertisement on close event.
   */
  constructor(options) {
    super();
    this.ros = options.ros;
    this.name = options.name;
    this.messageType = options.messageType;
    this.compression = options.compression || 'none';
    this.throttle_rate = options.throttle_rate || 0;
    this.latch = options.latch || false;
    this.queue_size = options.queue_size || 100;
    this.queue_length = options.queue_length || 0;
    this.reconnect_on_close =
      options.reconnect_on_close !== undefined
        ? options.reconnect_on_close
        : true;

    // Check for valid compression types
    if (
      this.compression &&
      this.compression !== 'png' &&
      this.compression !== 'cbor' &&
      this.compression !== 'cbor-raw' &&
      this.compression !== 'none'
    ) {
      this.emit(
        'warning',
        this.compression +
          ' compression is not supported. No compression will be used.'
      );
      this.compression = 'none';
    }

    // Check if throttle rate is negative
    if (this.throttle_rate < 0) {
      this.emit('warning', this.throttle_rate + ' is not allowed. Set to 0');
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
            this.ros.once('connection', () => {
              this.waitForReconnect = false;
            });
          }
        };
        this.ros.on('close', this.reconnectFunc);
      };
    } else {
      this.callForSubscribeAndAdvertise = this.ros.callOnConnection;
    }
  }

  _messageCallback = (data) => {
    this.emit('message', data);
  };
  /**
   * @callback subscribeCallback
   * @param {T} message - The published message.
   */
  /**
   * Every time a message is published for the given topic, the callback
   * will be called with the message object.
   *
   * @param {subscribeCallback} callback - Function with the following params:
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.on('message', callback);
    }

    if (this.subscribeId) {
      return;
    }
    this.ros.on(this.name, this._messageCallback);
    this.subscribeId =
      'subscribe:' + this.name + ':' + (++this.ros.idCounter).toString();

    this.callForSubscribeAndAdvertise({
      op: 'subscribe',
      id: this.subscribeId,
      type: this.messageType,
      topic: this.name,
      compression: this.compression,
      throttle_rate: this.throttle_rate,
      queue_length: this.queue_length
    });
  }
  /**
   * Unregister as a subscriber for the topic. Unsubscribing will stop
   * and remove all subscribe callbacks. To remove a callback, you must
   * explicitly pass the callback function in.
   *
   * @param {import('eventemitter3').EventEmitter.ListenerFn} [callback] - The callback to unregister, if
   *     provided and other listeners are registered the topic won't
   *     unsubscribe, just stop emitting to the passed listener.
   */
  unsubscribe(callback) {
    if (callback) {
      this.off('message', callback);
      // If there is any other callbacks still subscribed don't unsubscribe
      if (this.listeners('message').length) {
        return;
      }
    }
    if (!this.subscribeId) {
      return;
    }
    // Note: Don't call this.removeAllListeners, allow client to handle that themselves
    this.ros.off(this.name, this._messageCallback);
    if (this.reconnect_on_close) {
      this.ros.off('close', this.reconnectFunc);
    }
    this.emit('unsubscribe');
    this.ros.callOnConnection({
      op: 'unsubscribe',
      id: this.subscribeId,
      topic: this.name
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
    this.advertiseId =
      'advertise:' + this.name + ':' + (++this.ros.idCounter).toString();
    this.callForSubscribeAndAdvertise({
      op: 'advertise',
      id: this.advertiseId,
      type: this.messageType,
      topic: this.name,
      latch: this.latch,
      queue_size: this.queue_size
    });
    this.isAdvertised = true;

    if (!this.reconnect_on_close) {
      this.ros.on('close', () => {
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
      this.ros.off('close', this.reconnectFunc);
    }
    this.emit('unadvertise');
    this.ros.callOnConnection({
      op: 'unadvertise',
      id: this.advertiseId,
      topic: this.name
    });
    this.isAdvertised = false;
  }
  /**
   * Publish the message.
   *
   * @param {T} message - The message to publish.
   */
  publish(message) {
    if (!this.isAdvertised) {
      this.advertise();
    }

    this.ros.idCounter++;
    var call = {
      op: 'publish',
      id: 'publish:' + this.name + ':' + this.ros.idCounter,
      topic: this.name,
      msg: message,
      latch: this.latch
    };
    this.ros.callOnConnection(call);
  }
}
