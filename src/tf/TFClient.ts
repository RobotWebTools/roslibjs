/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import ActionClient from "../actionlib/ActionClient.js";
import Goal from "../actionlib/Goal.js";

import Service from "../core/Service.js";
import Topic from "../core/Topic.js";
import Ros from "../core/Ros.js";
import { tf2_msgs } from "../types/tf2_msgs.js";
import { tf2_web_republisher } from "../types/tf2_web_republisher.js";

import BaseTFClient from "./BaseTFClient.js";

/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 */
export default class TFClient extends BaseTFClient {
  currentGoal: Goal<tf2_web_republisher.TFSubscriptionGoal> | false = false;
  currentTopic: Topic<tf2_msgs.TFMessage> | false = false;
  repubServiceName: string;
  actionClient: ActionClient<tf2_web_republisher.TFSubscriptionGoal>;
  serviceClient: Service<
    tf2_web_republisher.RepublishTFsRequest,
    tf2_web_republisher.RepublishTFsResponse
  >;
  _subscribeCB: ((tf: tf2_msgs.TFMessage) => void) | undefined = undefined;

  /**
   * @param options
   * @param options.ros - The ROSLIB.Ros connection handle.
   * @param [options.fixedFrame=base_link] - The fixed frame.
   * @param [options.angularThres=2.0] - The angular threshold for the TF republisher.
   * @param [options.transThres=0.01] - The translation threshold for the TF republisher.
   * @param [options.rate=10.0] - The rate for the TF republisher.
   * @param [options.updateDelay=50] - The time (in ms) to wait after a new subscription
   *     to update the TF republisher's list of TFs.
   * @param [options.topicTimeout=2.0] - The timeout parameter for the TF republisher.
   * @param [options.serverName="/tf2_web_republisher"] - The name of the tf2_web_republisher server.
   * @param [options.repubServiceName="/republish_tfs"] - The name of the republish_tfs service (non groovy compatibility mode only).
   */
  constructor({
    repubServiceName = "/republish_tfs",
    ...options
  }: {
    ros: Ros;
    fixedFrame?: string;
    angularThres?: number;
    transThres?: number;
    rate?: number;
    updateDelay?: number;
    topicTimeout?: number;
    serverName?: string;
    repubServiceName?: string;
  }) {
    super(options);

    this.repubServiceName = repubServiceName;

    // Create an Action Client
    this.actionClient = new ActionClient({
      ros: this.ros,
      serverName: this.serverName,
      actionName: "tf2_web_republisher/TFSubscriptionAction",
      omitStatus: true,
      omitResult: true,
    });

    // Create a Service Client
    this.serviceClient = new Service({
      ros: this.ros,
      name: this.repubServiceName,
      serviceType: "tf2_web_republisher/RepublishTFs",
    });
  }

  /**
   * Create and send a new goal (or service request) to the tf2_web_republisher
   * based on the current list of TFs.
   */
  updateGoal() {
    const goalMessage: tf2_web_republisher.TFSubscriptionGoal = {
      source_frames: Object.keys(this.frameInfos),
      target_frame: this.fixedFrame,
      angular_thres: this.angularThres,
      trans_thres: this.transThres,
      rate: this.rate,
    };

    /*
     * if we're running in groovy compatibility mode (the default)
     * then use the action interface to tf2_web_republisher
     */
    if (this.ros.groovyCompatibility) {
      if (this.currentGoal) {
        this.currentGoal.cancel();
      }
      this.currentGoal = new Goal<tf2_web_republisher.TFSubscriptionGoal>({
        actionClient: this.actionClient,
        goalMessage: goalMessage,
      });

      this.currentGoal.on("feedback", this.processTFArray.bind(this));
      this.currentGoal.send();
    } else {
      /*
       * otherwise, use the service interface
       * The service interface has the same parameters as the action,
       * plus the timeout
       */
      this.serviceClient.callService(
        { ...goalMessage, timeout: this.topicTimeout },
        this.processResponse.bind(this),
      );
    }

    this.republisherUpdateRequested = false;
  }

  /**
   * Process the service response and subscribe to the tf republisher
   * topic.
   *
   * @param response - The service response containing the topic name.
   */
  processResponse(response: tf2_web_republisher.RepublishTFsResponse) {
    /*
     * Do not setup a topic subscription if already disposed. Prevents a race condition where
     * The dispose() function is called before the service call receives a response.
     */
    if (this._isDisposed) {
      return;
    }

    /*
     * if we subscribed to a topic before, unsubscribe so
     * the republisher stops publishing it
     */
    if (this.currentTopic) {
      this.currentTopic.unsubscribe(this._subscribeCB);
    }

    this.currentTopic = new Topic<tf2_msgs.TFMessage>({
      ros: this.ros,
      name: response.topic_name,
      messageType: "tf2_web_republisher/TFArray",
    });
    this._subscribeCB = this.processTFArray.bind(this);
    // @ts-expect-error Function was bound above
    this.currentTopic.subscribe(this._subscribeCB);
  }

  /**
   * Unsubscribe and unadvertise all topics associated with this TFClient.
   */
  dispose() {
    super.dispose();
    this.actionClient.dispose();
    if (this.currentTopic) {
      this.currentTopic.unsubscribe(this._subscribeCB);
    }
  }
}
