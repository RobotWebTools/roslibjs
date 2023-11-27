export = Topic;
/**
 * Publish and/or subscribe to a topic in ROS.
 *
 * Emits the following events:
 *  * 'warning' - If there are any warning during the Topic creation.
 *  * 'message' - The message data from rosbridge.
 */
declare class Topic extends EventEmitter2 {
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
    constructor(options: {
        ros: Ros;
        name: string;
        messageType: string;
        compression?: string | undefined;
        throttle_rate?: number | undefined;
        queue_size?: number | undefined;
        latch?: boolean | undefined;
        queue_length?: number | undefined;
        reconnect_on_close?: boolean | undefined;
    });
    ros: Ros;
    name: string;
    messageType: string;
    isAdvertised: boolean;
    compression: string;
    throttle_rate: number;
    latch: boolean;
    queue_size: number;
    queue_length: number;
    reconnect_on_close: boolean;
    waitForReconnect: any;
    reconnectFunc: any;
    callForSubscribeAndAdvertise: (message: any) => void;
    _messageCallback: (data: any) => void;
    /**
     * @callback subscribeCallback
     * @param {Object} message - The published message.
     */
    /**
     * Every time a message is published for the given topic, the callback
     * will be called with the message object.
     *
     * @param {subscribeCallback} callback - Function with the following params:
     */
    subscribe(callback: (message: any) => any): void;
    subscribeId: string | null | undefined;
    /**
     * Unregister as a subscriber for the topic. Unsubscribing will stop
     * and remove all subscribe callbacks. To remove a callback, you must
     * explicitly pass the callback function in.
     *
     * @param {import('eventemitter2').ListenerFn} [callback] - The callback to unregister, if
     *     provided and other listeners are registered the topic won't
     *     unsubscribe, just stop emitting to the passed listener.
     */
    unsubscribe(callback?: import("eventemitter2").ListenerFn | undefined): void;
    /**
     * Register as a publisher for the topic.
     */
    advertise(): void;
    advertiseId: string | undefined;
    /**
     * Unregister as a publisher for the topic.
     */
    unadvertise(): void;
    /**
     * Publish the message.
     *
     * @param {Message} message - A ROSLIB.Message object.
     */
    publish(message: Message): void;
}
import EventEmitter2_1 = require("eventemitter2");
import EventEmitter2 = EventEmitter2_1.EventEmitter2;
import Ros = require("../core/Ros");
import Message = require("./Message");
