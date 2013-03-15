(function (root, factory) {
    if(typeof define === 'function' && define.amd) {
        define(['eventemitter2'],factory);
    }
    else {
        root.ActionClient = factory(root.EventEmitter2);
    }
}(this, function(EventEmitter2) {

var ActionClient = function(options) {
  var actionClient = this;
  options = options || {};
  actionClient.ros         = options.ros;
  actionClient.serverName  = options.serverName;
  actionClient.actionName  = options.actionName;
  actionClient.timeout     = options.timeout;
  actionClient.goals       = {};

  actionClient.goalTopic = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/goal'
  , messageType : actionClient.actionName + 'Goal'
  });
  actionClient.goalTopic.advertise();

  actionClient.cancelTopic = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/cancel'
  , messageType : 'actionlib_msgs/GoalID'
  });
  actionClient.cancelTopic.advertise();

  var receivedStatus = false;
  var statusListener = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/status'
  , messageType : 'actionlib_msgs/GoalStatusArray'
  });
  statusListener.subscribe(function (statusMessage) {
    receivedStatus = true;

    statusMessage.status_list.forEach(function(status) {
      var goal = actionClient.goals[status.goal_id.id];
      if (goal) {
        goal.emit('status', status);
      }
    });
  });

  // If timeout specified, emit a 'timeout' event if the ActionServer does not
  // respond before the timeout.
  if (actionClient.timeout) {
    setTimeout(function() {
      if (!receivedStatus) {
        actionClient.emit('timeout');
      }
    }, actionClient.timeout);
  }

  // Subscribe to the feedback, and result topics
  var feedbackListener = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/feedback'
  , messageType : actionClient.actionName + 'Feedback'
  });
  feedbackListener.subscribe(function (feedbackMessage) {
    var goal = actionClient.goals[feedbackMessage.status.goal_id.id];

    if (goal) {
      goal.emit('status', feedbackMessage.status);
      goal.emit('feedback', feedbackMessage.feedback);
    }
  });

  var resultListener = new actionClient.ros.Topic({
    name        : actionClient.serverName + '/result'
  , messageType : actionClient.actionName + 'Result'
  });
  resultListener.subscribe(function (resultMessage) {
    var goal = actionClient.goals[resultMessage.status.goal_id.id];

    if (goal) {
      goal.emit('status', resultMessage.status);
      goal.emit('result', resultMessage.result);
    }
  });

  actionClient.cancel = function() {
    var cancelMessage = new actionClient.ros.Message({});
    actionClient.cancelTopic.publish(cancelMessage);
  };

  actionClient.Goal = function(goalMsg) {
    var goal = this;

    goal.isFinished = false;
    goal.status;
    goal.result;
    goal.feedback;

    var date = new Date();
    goal.goalId = 'goal_' + Math.random() + "_" + date.getTime();
    goal.goalMessage = new actionClient.ros.Message({
      goal_id : {
        stamp: {
          secs  : 0
        , nsecs : 0
        }
      , id: goal.goalId
      }
    , goal: goalMsg
    });

    goal.on('status', function(status) {
      goal.status = status;
    });

    goal.on('result', function(result) {
      goal.isFinished = true;
      goal.result = result;
    });

    goal.on('feedback', function(feedback) {
      goal.feedback = feedback;
    });

    actionClient.goals[goal.goalId] = this;

    goal.send = function(timeout) {
      actionClient.goalTopic.publish(goal.goalMessage);
      if (timeout) {
         setTimeout(function() {
           if (!goal.isFinished) {
             goal.emit('timeout');
           }
         }, timeout);
      }
    };

    goal.cancel = function() {
      var cancelMessage = new actionClient.ros.Message({
        id: goal.goalId
      });
      actionClient.cancelTopic.publish(cancelMessage);
    };
  };
  actionClient.Goal.prototype.__proto__ = EventEmitter2.prototype;

};
ActionClient.prototype.__proto__ = EventEmitter2.prototype;
return ActionClient;
}
));
