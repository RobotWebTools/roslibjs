/**
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * An actionlib goal goal is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - if a timeout occurred while sending a goal 
 *
 *  @constructor
 *  @param object with following keys:
 *   * actionClient - the ROSLIB.ActionClient to use with this goal
 *   * goalMessage - The JSON object containing the goal for the action server
 */

ROSLIB.Goal = function(options) {
  var goal = this;
  this.actionClient = options.actionClient;
  this.goalMessage = options.goalMessage;
  this.isFinished = false;

  // used to create random IDs
  var date = new Date();

  /**
   * Send the goal to the action server.
   * 
   * @param timeout (optional) - a timeout length for the goal's result
   */
  this.send = function(timeout) {
    goal.actionClient.goalTopic.publish(goal.goalMessage);
    if (timeout) {
      setTimeout(function() {
        if (!goal.isFinished) {
          goal.emit('timeout');
        }
      }, timeout);
    }
  };

  /**
   * Cancel the current this.
   */
  this.cancel = function() {
    var cancelMessage = new ROSLIB.Message({
      id : goal.goalID
    });
    goal.actionClient.cancelTopic.publish(cancelMessage);
  };

  // create a random ID
  this.goalID = 'goal_' + Math.random() + "_" + date.getTime();
  // fill in the goal message
  this.goalMessage = new ROSLIB.Message({
    goal_id : {
      stamp : {
        secs : 0,
        nsecs : 0
      },
      id : this.goalID
    },
    goal : this.goalMessage
  });

  this.on('status', function(status) {
    this.status = status;
  });

  this.on('result', function(result) {
    this.isFinished = true;
    this.result = result;
  });

  this.on('feedback', function(feedback) {
    this.feedback = feedback;
  });

  // add the goal
  this.actionClient.goals[this.goalID] = this;

};
ROSLIB.Goal.prototype.__proto__ = EventEmitter2.prototype;
