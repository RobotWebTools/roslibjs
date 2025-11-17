import type { tf2_web_republisher } from "../types/tf2_web_republisher.ts";
import Action from "../core/Action.ts";
import BaseTFClient from "./BaseTFClient.ts";

/**
 * A TF Client that listens to TFs from tf2_web_republisher using ROS2 actions.
 */
export default class ROS2TFClient extends BaseTFClient {
  goal_id: string;
  actionClient: Action<
    tf2_web_republisher.TFSubscriptionGoal,
    tf2_web_republisher.TFSubscriptionFeedback,
    tf2_web_republisher.TFSubscriptionResult
  >;
  currentGoal?: tf2_web_republisher.TFSubscriptionGoal;

  constructor(options: ConstructorParameters<typeof BaseTFClient>[0]) {
    super(options);

    this.goal_id = "";

    // Create an Action Client for ROS2
    this.actionClient = new Action({
      ros: this.ros,
      name: this.serverName,
      actionType: "tf2_web_republisher_interfaces/TFSubscription",
    });
  }

  /**
   * Create and send a new goal (or service request) to the tf2_web_republisher
   * based on the current list of TFs.
   */
  override updateGoal() {
    const goalMessage = {
      source_frames: Object.keys(this.frameInfos),
      target_frame: this.fixedFrame,
      angular_thres: this.angularThres,
      trans_thres: this.transThres,
      rate: this.rate,
    };

    if (this.goal_id !== "") {
      this.actionClient.cancelGoal(this.goal_id);
    }
    this.currentGoal = goalMessage;

    const id = this.actionClient.sendGoal(
      goalMessage,
      () => {},
      (feedback: tf2_web_republisher.TFSubscriptionFeedback) => {
        this.processTFArray(feedback);
      },
    );
    if (typeof id === "string") {
      this.goal_id = id;
    }

    this.republisherUpdateRequested = false;
  }

  /**
   * Unsubscribe and unadvertise all topics associated with this TFClient.
   */
  dispose() {
    if (this.goal_id !== "") {
      this.actionClient.cancelGoal(this.goal_id);
    }
  }
}
