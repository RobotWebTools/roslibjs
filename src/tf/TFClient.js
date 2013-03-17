/**
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * fixedFrame - the fixed frame, like /base_link
 *   * angularThres - the angular threshold for the TF republisher
 *   * transThres - the translation threshold for the TF republisher
 *   * rate - the rate for the TF republisher
 *   * goalUpdateDelay - the goal update delay for the TF republisher
 */
ROSLIB.TFClient = function(options) {
  var tfClient = this;
  var options = options || {};
  this.ros = options.ros;
  this.fixedFrame = options.fixedFrame || '/base_link';
  this.angularThres = options.angularThres || 2.0;
  this.transThres = options.transThres || 0.01;
  this.rate = options.rate || 10.0;
  this.goalUpdateDelay = options.goalUpdateDelay || 50;

  this.currentGoal = false;
  this.frameInfos = {};
  this.goalUpdateRequested = false;

  // create an ActionClient
  this.actionClient = new ROSLIB.ActionClient({
    ros : this.ros,
    serverName : '/tf2_web_republisher',
    actionName : 'tf2_web_republisher/TFSubscriptionAction'
  });

  /**
   * Process the incoming TF message and send them out using the callback functions.
   * 
   * @param tf - the TF message from the server
   */
  this.processFeedback = function(tf) {
    tf.transforms.forEach(function(transform) {
      var frameID = transform.child_frame_id;
      var info = tfClient.frameInfos[frameID];
      if (info != undefined) {
        info.transform = new ROSLIB.Transform(transform.transform.translation,
            transform.transform.rotation);
        info.cbs.forEach(function(cb) {
          cb(info.transform);
        });
      }
    });
  };

  /**
   * Create and send a new goal to the tf2_web_republisher based on the current list of TFs.
   */
  this.updateGoal = function() {
    // Anytime the list of frames changes, we will need to send a new goal.
    if (tfClient.currentGoal) {
      tfClient.currentGoal.cancel();
    }

    var goalMessage = {
      source_frames : [],
      target_frame : tfClient.fixedFrame,
      angular_thres : tfClient.angularThres,
      trans_thres : tfClient.transThres,
      rate : tfClient.rate
    };

    for (frame in tfClient.frameInfos) {
      goalMessage.source_frames.push(frame);
    }

    tfClient.currentGoal = new ROSLIB.Goal({
      actionClient : tfClient.actionClient,
      goalMessage : goalMessage
    });
    tfClient.currentGoal.on('feedback', tfClient.processFeedback.bind(tfClient));
    tfClient.currentGoal.send();
    tfClient.goalUpdateRequested = false;
  };

  /**
   * Subscribe to the given TF frame.
   * 
   * @param frameID - the TF frame to subscribe to
   * @param callback - function with params:
   *   * transform - the transform data
   */
  this.subscribe = function(frameID, callback) {
    // make sure the frame id is relative
    if (frameID[0] === '/') {
      frameID = frameID.substring(1);
    }
    // if there is no callback registered for the given frame, create emtpy callback list
    if (tfClient.frameInfos[frameID] == undefined) {
      tfClient.frameInfos[frameID] = {
        cbs : []
      };
      if (!tfClient.goalUpdateRequested) {
        setTimeout(tfClient.updateGoal.bind(tfClient), tfClient.goalUpdateDelay);
        tfClient.goalUpdateRequested = true;
      }
    } else {
      // if we already have a transform, call back immediately
      if (tfClient.frameInfos[frameID].transform != undefined) {
        callback(tfClient.frameInfos[frameID].transform);
      }
    }
    tfClient.frameInfos[frameID].cbs.push(callback);
  };

  /**
   * Unsubscribe from the given TF frame.
   * 
   * @param frameID - the TF frame to unsubscribe from
   * @param callback - the callback function to remove
   */
  this.unsubscribe = function(frameID, callback) {
    var info = tfClient.frameInfos[frameID];
    if (info != undefined) {
      var cbIndex = info.cbs.indexOf(callback);
      if (cbIndex >= 0) {
        info.cbs.splice(cbIndex, 1);
        if (info.cbs.length == 0) {
          delete tfClient.frameInfos[frameID];
        }
        tfClient.needUpdate = true;
      }
    }
  };
};
