import Transform from "../math/Transform.js";
import { EventEmitter } from "eventemitter3";

/**
 * Base class for TF Clients that provides common functionality.
 */
export default class BaseTFClient extends EventEmitter {
  frameInfos = {};
  republisherUpdateRequested = false;
  /** @type {((tf: any) => any) | undefined} */
  _subscribeCB = undefined;
  _isDisposed = false;
  ros;
  fixedFrame;
  angularThres;
  transThres;
  rate;
  updateDelay;
  topicTimeout;
  serverName;

  /**
   * @param {Object} options
   * @param {import('../core/Ros.js').default} options.ros - The ROSLIB.Ros connection handle.
   * @param {string} [options.fixedFrame=base_link] - The fixed frame.
   * @param {number} [options.angularThres=2.0] - The angular threshold for the TF republisher.
   * @param {number} [options.transThres=0.01] - The translation threshold for the TF republisher.
   * @param {number} [options.rate=10.0] - The rate for the TF republisher.
   * @param {number} [options.updateDelay=50] - The time (in ms) to wait after a new subscription
   *     to update the TF republisher's list of TFs.
   * @param {number} [options.topicTimeout=2.0] - The timeout parameter for the TF republisher.
   * @param {string} [options.serverName="/tf2_web_republisher"] - The name of the tf2_web_republisher server.
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
  }) {
    super();

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
   * @param {Object} tf - The TF message from the server.
   */
  processTFArray(tf) {
    tf.transforms.forEach((transform) => {
      let frameID = transform.child_frame_id;
      if (frameID[0] === "/") {
        frameID = frameID.substring(1);
      }
      const info = this.frameInfos[frameID];
      if (info) {
        info.transform = new Transform({
          translation: transform.transform.translation,
          rotation: transform.transform.rotation,
        });
        info.cbs.forEach((cb) => {
          cb(info.transform);
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
   * @callback subscribeCallback
   * @param {Transform} callback.transform - The transform data.
   */
  /**
   * Subscribe to the given TF frame.
   *
   * @param {string} frameID - The TF frame to subscribe to.
   * @param {subscribeCallback} callback - Function with the following params:
   */
  subscribe(frameID, callback) {
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
        setTimeout(this.updateGoal.bind(this), this.updateDelay);
        this.republisherUpdateRequested = true;
      }
    }

    // if we already have a transform, callback immediately
    else if (this.frameInfos[frameID].transform) {
      callback(this.frameInfos[frameID].transform);
    }
    this.frameInfos[frameID].cbs.push(callback);
  }

  /**
   * Unsubscribe from the given TF frame.
   *
   * @param {string} frameID - The TF frame to unsubscribe from.
   * @param {function} callback - The callback function to remove.
   */
  unsubscribe(frameID, callback) {
    // remove leading slash, if it's there
    if (frameID.startsWith("/")) {
      frameID = frameID.substring(1);
    }
    const info = this.frameInfos[frameID];
    // eslint-disable-next-line no-var -- literally what even is going on here
    for (var cbs = info?.cbs || [], idx = cbs.length; idx--; ) {
      if (cbs[idx] === callback) {
        cbs.splice(idx, 1);
      }
    }
    if (!callback || cbs.length === 0) {
      delete this.frameInfos[frameID];
    }
  }

  /**
   * Basic dispose functionality. Subclasses should override to add
   * their specific cleanup logic.
   */
  dispose() {
    this._isDisposed = true;
  }
}
