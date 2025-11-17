/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import ActionClient from "../actionlib/ActionClient.ts";
import Goal from "../actionlib/Goal.ts";

import Topic from "../core/Topic.ts";
import type { tf2_msgs } from "../types/tf2_msgs.ts";
import type { tf2_web_republisher } from "../types/tf2_web_republisher.ts";

import BaseTFClient from "./BaseTFClient.ts";

/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 */
export default class TFClient extends BaseTFClient {
  currentGoal:
    | Goal<
        tf2_web_republisher.TFSubscriptionGoal,
        tf2_web_republisher.TFSubscriptionFeedback
      >
    | false = false;
  currentTopic: Topic<tf2_msgs.TFMessage> | false = false;
  actionClient: ActionClient<
    tf2_web_republisher.TFSubscriptionGoal,
    tf2_web_republisher.TFSubscriptionFeedback
  >;
  #subscribeCB: ((tf: tf2_msgs.TFMessage) => void) | undefined = undefined;
  #isDisposed = false;

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
   */
  constructor(options: ConstructorParameters<typeof BaseTFClient>[0]) {
    super(options);

    // Create an Action Client
    this.actionClient = new ActionClient({
      ros: this.ros,
      serverName: this.serverName,
      actionName: "tf2_web_republisher/TFSubscriptionAction",
      omitStatus: true,
      omitResult: true,
    });
  }

  /**
   * Create and send a new goal (or service request) to the tf2_web_republisher
   * based on the current list of TFs.
   */
  override updateGoal() {
    const goalMessage: tf2_web_republisher.TFSubscriptionGoal = {
      source_frames: Object.keys(this.frameInfos),
      target_frame: this.fixedFrame,
      angular_thres: this.angularThres,
      trans_thres: this.transThres,
      rate: this.rate,
    };

    if (this.currentGoal) {
      this.currentGoal.cancel();
    }
    this.currentGoal = new Goal({
      actionClient: this.actionClient,
      goalMessage: goalMessage,
    });

    this.currentGoal.on("feedback", (feedback) => {
      this.processTFArray(feedback);
    });
    this.currentGoal.send();

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
    if (this.#isDisposed) {
      return;
    }

    /*
     * if we subscribed to a topic before, unsubscribe so
     * the republisher stops publishing it
     */
    if (this.currentTopic) {
      this.currentTopic.unsubscribe(this.#subscribeCB);
    }

    this.currentTopic = new Topic<tf2_msgs.TFMessage>({
      ros: this.ros,
      name: response.topic_name,
      messageType: "tf2_web_republisher/TFArray",
    });
    this.#subscribeCB = (response) => {
      this.processTFArray(response);
    };
    this.currentTopic.subscribe(this.#subscribeCB);
  }

  /**
   * Unsubscribe and unadvertise all topics associated with this TFClient.
   */
  dispose() {
    this.#isDisposed = true;
    this.actionClient.dispose();
    if (this.currentTopic) {
      this.currentTopic.unsubscribe(this.#subscribeCB);
    }
  }
}
