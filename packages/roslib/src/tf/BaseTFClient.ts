import Transform from "../math/Transform.ts";
import type Ros from "../core/Ros.ts";
import type { tf2_msgs } from "../types/tf2_msgs.ts";
import type { std_msgs } from "../types/std_msgs.ts";

/**
 * Base class for TF Clients that provides common functionality.
 */
export default class BaseTFClient {
  frameInfos: Record<
    string,
    { transform?: Transform; cbs: ((tf: Transform) => void)[] }
  > = {};
  republisherUpdateRequested = false;
  ros: Ros;
  fixedFrame: string;
  angularThres: number;
  transThres: number;
  rate: number;
  updateDelay: number;
  topicTimeout: std_msgs.time;
  serverName: string;

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
  constructor({
    ros,
    fixedFrame = "base_link",
    angularThres = 2.0,
    transThres = 0.01,
    rate = 10.0,
    updateDelay = 50,
    topicTimeout = 2.0,
    serverName = "/tf2_web_republisher",
  }: {
    ros: Ros;
    fixedFrame?: string;
    angularThres?: number;
    transThres?: number;
    rate?: number;
    updateDelay?: number;
    topicTimeout?: number;
    serverName?: string;
  }) {
    this.ros = ros;
    this.fixedFrame = fixedFrame;
    this.angularThres = angularThres;
    this.transThres = transThres;
    this.rate = rate;
    this.updateDelay = updateDelay;
    const seconds = topicTimeout;
    const secs = Math.floor(seconds);
    const nsecs = Math.floor((seconds - secs) * 1000000000);
    this.topicTimeout = {
      secs: secs,
      nsecs: nsecs,
    };
    this.serverName = serverName;
  }

  /**
   * Process the incoming TF message and send them out using the callback
   * functions.
   *
   * @param tf - The TF message from the server.
   */
  processTFArray(tf: tf2_msgs.TFMessage) {
    tf.transforms.forEach((transform) => {
      let frameID = transform.child_frame_id;
      if (frameID.startsWith("/")) {
        frameID = frameID.substring(1);
      }
      const info = this.frameInfos[frameID];
      if (info) {
        const tf = new Transform({
          translation: transform.transform.translation,
          rotation: transform.transform.rotation,
        });
        info.transform = tf;
        info.cbs.forEach((cb) => {
          cb(tf);
        });
      }
    }, this);
  }

  /**
   * Create and send a new goal (or service request) to the tf2_web_republisher
   * based on the current list of TFs.
   * This method should be overridden by subclasses.
   */
  updateGoal() {
    throw new Error("updateGoal() must be implemented by subclass");
  }

  /**
   * Subscribe to the given TF frame.
   *
   * @param frameID - The TF frame to subscribe to.
   * @param callback - Function with the following params:
   */
  subscribe(frameID: string, callback: (transform: Transform) => void) {
    // remove leading slash, if it's there
    if (frameID.startsWith("/")) {
      frameID = frameID.substring(1);
    }
    // if there is no callback registered for the given frame, create empty callback list
    if (!this.frameInfos[frameID]) {
      this.frameInfos[frameID] = {
        cbs: [],
      };
      if (!this.republisherUpdateRequested) {
        setTimeout(() => {
          this.updateGoal();
        }, this.updateDelay);
        this.republisherUpdateRequested = true;
      }
    }

    // if we already have a transform, callback immediately
    const transform = this.frameInfos[frameID]?.transform;
    if (transform) {
      callback(transform);
    }
    this.frameInfos[frameID]?.cbs.push(callback);
  }

  /**
   * Unsubscribe from the given TF frame.
   *
   * @param frameID - The TF frame to unsubscribe from.
   * @param [callback] - The callback function to remove.
   */
  unsubscribe(frameID: string, callback?: (transform: Transform) => void) {
    // remove leading slash, if it's there
    if (frameID.startsWith("/")) {
      frameID = frameID.substring(1);
    }
    const info = this.frameInfos[frameID];
    // eslint-disable-next-line no-var -- literally what even is going on here
    for (var cbs = info?.cbs ?? [], idx = cbs.length; idx--; ) {
      if (cbs[idx] === callback) {
        cbs.splice(idx, 1);
      }
    }
    if (!callback || cbs.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- TODO: refactor this to not cause runtime errors if you have a frame like "prototype" that would make JavaScript explode if you deleted it from an object
      delete this.frameInfos[frameID];
    }
  }
}
