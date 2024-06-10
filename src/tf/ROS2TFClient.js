
import Action from '../core/Action.js';
import Transform from '../math/Transform.js';

import Ros from '../core/Ros.js';
import {EventEmitter} from 'eventemitter3';

/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 */
export default class ROS2TFClient extends EventEmitter {
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
    constructor(options) {
        super();
        this.ros = options.ros;
        this.fixedFrame = options.fixedFrame || 'base_link';
        this.angularThres = options.angularThres || 2.0;
        this.transThres = options.transThres || 0.01;
        this.rate = options.rate || 10.0;
        this.updateDelay = options.updateDelay || 50;
        const seconds = options.topicTimeout || 2.0;
        const secs = Math.floor(seconds);
        const nsecs = Math.floor((seconds - secs) * 1E9);
        this.topicTimeout = {
            secs: secs,
            nsecs: nsecs
        };
        this.serverName = options.serverName || '/tf2_web_republisher';
        this.goal_id = '';
        this.frameInfos = {};
        this.republisherUpdateRequested = false;
        this._subscribeCB = undefined;
        this._isDisposed = false;

        // Create an Action Client
        this.actionClient = new Action({
            ros: options.ros,
            name: this.serverName,
            actionType: 'tf2_web_republisher_msgs/TFSubscription',
        });

    }

    /**
     * Process the incoming TF message and send them out using the callback
     * functions.
     *
     * @param {Object} tf - The TF message from the server.
     */
    processTFArray(tf) {
        let that = this;
        tf.transforms.forEach(function (transform) {
            let frameID = transform.child_frame_id;
            if (frameID[0] === '/') {
                frameID = frameID.substring(1);
            }
            const info = that.frameInfos[frameID];
            if (info) {
                info.transform = new Transform({
                    translation: transform.transform.translation,
                    rotation: transform.transform.rotation
                });
                info.cbs.forEach(function (cb) {
                    cb(info.transform);
                });
            }
        }, this);
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
            rate: this.rate
        };

        if (this.goal_id !== '') {
            this.actionClient.cancelGoal(this.goal_id);
        }
        this.currentGoal = goalMessage;

        const id = this.actionClient.sendGoal(goalMessage,
            (result) => {
            },
            (feedback) => {
                this.processTFArray(feedback)
            },
        );
        if (typeof id === 'string') {
            this.goal_id = id;
        }

        this.republisherUpdateRequested = false;
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
        if (frameID[0] === '/') {
            frameID = frameID.substring(1);
        }
        // if there is no callback registered for the given frame, create empty callback list
        if (!this.frameInfos[frameID]) {
            this.frameInfos[frameID] = {
                cbs: []
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
        if (frameID[0] === '/') {
            frameID = frameID.substring(1);
        }
        const info = this.frameInfos[frameID];
        for (var cbs = (info && info.cbs) || [], idx = cbs.length; idx--;) {
            if (cbs[idx] === callback) {
                cbs.splice(idx, 1);
            }
        }
        if (!callback || cbs.length === 0) {
            delete this.frameInfos[frameID];
        }
    }

    /**
     * Unsubscribe and unadvertise all topics associated with this TFClient.
     */
    dispose() {
        this._isDisposed = true;
    }
}
