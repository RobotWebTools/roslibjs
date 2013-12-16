/**
* Hacky actionlib SimpleActionServer (only tracks one goal)
* Author: Laura Lindzey
*/


ROSLIB.SimpleActionServer = function(options) {
    var that = this;
    options = options || {};
    this.ros = options.ros;
    this.serverName = options.serverName;
    this.actionName = options.actionName;

    // create and advertise publishers
    this.feedbackPublisher = new ROSLIB.Topic({
        ros : this.ros,
        name : this.serverName + '/feedback',
        messageType : this.actionName + 'Feedback'
    });
    this.feedbackPublisher.advertise();

    var statusPublisher = new ROSLIB.Topic({
        ros : this.ros,
        name : this.serverName + '/status',
        messageType : 'actionlib_msgs/GoalStatusArray'
    });
    statusPublisher.advertise();

    this.resultPublisher = new ROSLIB.Topic({
        ros : this.ros,
        name : this.serverName + '/result',
        messageType : this.actionName + 'Result'
    });
    this.resultPublisher.advertise();

    // create and subscribe to listeners
    var goalListener = new ROSLIB.Topic({
        ros : this.ros,
        name : this.serverName + '/goal',
        messageType : this.actionName + 'Goal'
    });

    var cancelListener = new ROSLIB.Topic({
        ros : this.ros,
        name : this.serverName + '/cancel',
        messageType : 'actionlib_msgs/GoalID'
    });

    // I need to track the goals and their status in order to publish status...
    this.statusMessage = new ROSLIB.Message({
        header : {
            stamp : {secs : 0, nsecs : 100},
            frame_id : ''
        },
        status_list : []
    });

    // needed for handling preemption prompted by a new goal being received
    this.currentGoal = null; // currently tracked goal
    this.nextGoal = null; // the one that'll be preempting

    goalListener.subscribe(function(goalMessage) {
        console.log('SAS got goal message w/ id:', goalMessage.goal_id.id);
    if(that.currentGoal) {
            console.log('...and we need to preempt currently-tracked goal');
            that.nextGoal = goalMessage;
            // needs to happen AFTER rest is set up
            that.emit('cancel');
    } else {
            console.log('... and no currently-tracked goal');
            that.statusMessage.status_list = [{goal_id : goalMessage.goal_id, status : 1}];
            that.currentGoal = goalMessage;
            that.emit('goal', goalMessage.goal);
    }
    });

    // helper function for determing ordering of timestamps
    // returns t1 < t2
    var isEarlier = function(t1, t2) {
        if(t1.secs > t2.secs) {
            return false;
        } else if(t1.secs < t2.secs) {
            return true;
        } else if(t1.nsecs < t2.nsecs) {
            return true;
        } else {
            return false;
        }
    };

    // TODO: this may be more complicated than necessary, since I'm
    // not sure if the callbacks can ever wind up with a scenario
    // where we've been preempted by a next goal, it hasn't finished
    // processing, and then we get a cancel message
    cancelListener.subscribe(function(cancelMessage) {
        console.log('SAS got cancel message!');
        console.log('...id: ', cancelMessage.id);
        console.log('...stamp: ', cancelMessage.stamp);

        // cancel ALL goals if both empty
        if(cancelMessage.stamp.secs === 0 && cancelMessage.stamp.secs === 0 && cancelMessage.id === '') {
            console.log('...Both empty! cancelling everything');
            that.nextGoal = null;
            if(that.currentGoal) {
                that.emit('cancel');
            }
        } else { // treat id and stamp independently
            if(that.currentGoal && cancelMessage.id === that.currentGoal.goal_id.id) {
                console.log('...ID matches current goal! cancelling it');
                that.emit('cancel');
            } else if(that.nextGoal && cancelMessage.id === that.nextGoal.goal_id.id) {
                console.log('...ID matches queued goal! cancelling it');
                that.nextGoal = null;
            }

            if(that.nextGoal && isEarlier(that.nextGoal.goal_id.stamp,
                                          cancelMessage.stamp)) {
                console.log('...stamp after next goal! cancelling it!');
                that.nextGoal = null;
            }
            if(that.currentGoal && isEarlier(that.currentGoal.goal_id.stamp,
                                             cancelMessage.stamp)) {
                console.log('...stamp after current goal! cancelling it!');
                that.emit('cancel');
            }
        }
    });

    // publish status at pseudo-fixed rate; required for clients to know they've connected
    var statusInterval = setInterval( function() {
        var currentTime = new Date();
        var secs = Math.floor(currentTime.getTime()/1000);
        var nsecs = Math.round(1000000000*(currentTime.getTime()/1000-secs));
        that.statusMessage.header.stamp.secs = secs;
        that.statusMessage.header.stamp.nsecs = nsecs;
        statusPublisher.publish(that.statusMessage);
    }, 500); // publish every 500ms

};

ROSLIB.SimpleActionServer.prototype.__proto__ = EventEmitter2.prototype;

ROSLIB.SimpleActionServer.prototype.setSucceeded = function(result2) {
    console.log('SAS got setSucceeded call for goal: ', this.currentGoal.goal_id.id);

    var resultMessage = new ROSLIB.Message({
        status : {goal_id : this.currentGoal.goal_id, status : 3},
        result : result2
    });
    this.resultPublisher.publish(resultMessage);

    this.statusMessage.status_list = [];
    if(this.nextGoal) {
        console.log('SAS: Bug or Weird synchronization thing!');
        console.log(' ... goal was preempted but finished first');
        this.currentGoal = this.nextGoal;
        this.nextGoal = null;
        this.emit('goal', this.currentGoal.goal);
    } else {
        this.currentGoal = null;
    }
};

ROSLIB.SimpleActionServer.prototype.sendFeedback = function(feedback2) {
    console.log('SAS got sendFeedback call for goal: ', this.currentGoal.goal_id.id);

    var feedbackMessage = new ROSLIB.Message({
        status : {goal_id : this.currentGoal.goal_id, status : 1},
        feedback : feedback2
    });
    this.feedbackPublisher.publish(feedbackMessage);
};

ROSLIB.SimpleActionServer.prototype.setPreempted = function() {
    console.log('SAS got setPreempted for goal: ', this.currentGoal.goal_id.id);

    this.statusMessage.status_list = [];
    var resultMessage = new ROSLIB.Message({
        status : {goal_id : this.currentGoal.goal_id, status : 2},
    });
    this.resultPublisher.publish(resultMessage);

    console.log('...checking for waiting goal');
    if(this.nextGoal) {
        console.log('......Preempted, but had another goal waiting!');
        this.currentGoal = this.nextGoal;
        this.nextGoal = null;
        this.emit('goal', this.currentGoal.goal);
    } else {
        console.log('......no goal waiting');
        this.currentGoal = null;
    }
};
