import Action from "../core/Action.js";
import BaseTFClient from "./BaseTFClient.js";

/**
 * A TF Client that listens to TFs from tf2_web_republisher using ROS2 actions.
 */
export default class ROS2TFClient extends BaseTFClient {
  goal_id;
  actionClient;
  currentGoal;

  /** @param {ConstructorParameters<typeof BaseTFClient>[0]} options */
  constructor(options) {
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
  updateGoal() {
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
      (feedback) => {
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
    super.dispose();
    if (this.goal_id !== "") {
      this.actionClient.cancelGoal(this.goal_id);
    }
  }
}
