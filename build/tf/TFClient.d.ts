export = TFClient;
/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 */
declare class TFClient extends EventEmitter2 {
    /**
     * @param {Object} options
     * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
     * @param {string} [options.fixedFrame=base_link] - The fixed frame.
     * @param {number} [options.angularThres=2.0] - The angular threshold for the TF republisher.
     * @param {number} [options.transThres=0.01] - The translation threshold for the TF republisher.
     * @param {number} [options.rate=10.0] - The rate for the TF republisher.
     * @param {number} [options.updateDelay=50] - The time (in ms) to wait after a new subscription
     *     to update the TF republisher's list of TFs.
     * @param {number} [options.topicTimeout=2.0] - The timeout parameter for the TF republisher.
     * @param {string} [options.serverName="/tf2_web_republisher"] - The name of the tf2_web_republisher server.
     * @param {string} [options.repubServiceName="/republish_tfs"] - The name of the republish_tfs service (non groovy compatibility mode only).
     */
    constructor(options: {
        ros: Ros;
        fixedFrame?: string | undefined;
        angularThres?: number | undefined;
        transThres?: number | undefined;
        rate?: number | undefined;
        updateDelay?: number | undefined;
        topicTimeout?: number | undefined;
        serverName?: string | undefined;
        repubServiceName?: string | undefined;
    });
    ros: Ros;
    fixedFrame: string;
    angularThres: number;
    transThres: number;
    rate: number;
    updateDelay: number;
    topicTimeout: {
        secs: number;
        nsecs: number;
    };
    serverName: string;
    repubServiceName: string;
    /** @type {Goal|false} */
    currentGoal: Goal | false;
    /** @type {Topic|false} */
    currentTopic: Topic | false;
    frameInfos: {};
    republisherUpdateRequested: boolean;
    _subscribeCB: ((tf: any) => void) | undefined;
    _isDisposed: boolean;
    actionClient: ActionClient;
    serviceClient: Service;
    /**
     * Process the incoming TF message and send them out using the callback
     * functions.
     *
     * @param {Object} tf - The TF message from the server.
     */
    processTFArray(tf: any): void;
    /**
     * Create and send a new goal (or service request) to the tf2_web_republisher
     * based on the current list of TFs.
     */
    updateGoal(): void;
    /**
     * Process the service response and subscribe to the tf republisher
     * topic.
     *
     * @param {Object} response - The service response containing the topic name.
     */
    processResponse(response: any): void;
    /**
     * @callback subscribeCallback
     * @param {Transform} callback.transform - The transform data.
     */
    /**
     * Subscribe to the given TF frame.
     *
     * @param {string} frameID - The TF frame to subscribe to.
     * @param {subscribeCallback} callback - Function with the following params:
     */
    subscribe(frameID: string, callback: (transform: Transform) => any): void;
    /**
     * Unsubscribe from the given TF frame.
     *
     * @param {string} frameID - The TF frame to unsubscribe from.
     * @param {function} callback - The callback function to remove.
     */
    unsubscribe(frameID: string, callback: Function): void;
    /**
     * Unsubscribe and unadvertise all topics associated with this TFClient.
     */
    dispose(): void;
}
import { EventEmitter2 } from "eventemitter2";
import Ros = require("../core/Ros");
import Goal = require("../actionlib/Goal");
import Topic = require("../core/Topic.js");
import ActionClient = require("../actionlib/ActionClient");
import Service = require("../core/Service.js");
import Transform = require("../math/Transform");
