/**
 * @fileOverview
 * @author Laura Lindzey - lindzey@gmail.com
 */

var Topic = require('../core/Topic');
var Message = require('../core/Message');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * An actionlib action server client.
 *
 * Emits the following events:
 *  * 'goal' - Goal sent by action client.
 *  * 'cancel' - Action client has canceled the request.
 *
 * @constructor
 * @param {Object} options
 * @param {Ros} options.ros - The ROSLIB.Ros connection handle.
 * @param {string} options.serverName - The action server name, like '/fibonacci'.
 * @param {string} options.actionName - The action message name, like 'actionlib_tutorials/FibonacciAction'.
 */
function SimpleActionServer(options) {
    var that = this;
    options = options || {};
    this.ros = options.ros;
    this.serverName = options.serverName;
    this.actionName = options.actionName;

    // create and advertise publishers
    this.feedbackPublisher = new Topic({
        ros : this.ros,
        name : this.serverName + '/feedback',
        messageType : this.actionName + 'Feedback'
    });
    this.feedbackPublisher.advertise();

    var statusPublisher = new Topic({
        ros : this.ros,
        name : this.serverName + '/status',
        messageType : 'actionlib_msgs/GoalStatusArray'
    });
    statusPublisher.advertise();

    this.resultPublisher = new Topic({
        ros : this.ros,
        name : this.serverName + '/result',
        messageType : this.actionName + 'Result'
    });
    this.resultPublisher.advertise();

    // create and subscribe to listeners
    var goalListener = new Topic({
        ros : this.ros,
        name : this.serverName + '/goal',
        messageType : this.actionName + 'Goal'
    });

    var cancelListener = new Topic({
        ros : this.ros,
        name : this.serverName + '/cancel',
        messageType : 'actionlib_msgs/GoalID'
    });

    // Track the goals and their status in order to publish status...
    this.statusMessage = new Message({
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

    if(that.currentGoal) {
            that.nextGoal = goalMessage;
            // needs to happen AFTER rest is set up
            that.emit('cancel');
    } else {
            that.statusMessage.status_list = [{goal_id : goalMessage.goal_id, status : 1}];
            that.currentGoal = goalMessage;
            that.emit('goal', goalMessage.goal);
    }
    });

    // helper function to determine ordering of timestamps
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

        // cancel ALL goals if both empty
        if(cancelMessage.stamp.secs === 0 && cancelMessage.stamp.secs === 0 && cancelMessage.id === '') {
            that.nextGoal = null;
            if(that.currentGoal) {
                that.emit('cancel');
            }
        } else { // treat id and stamp independently
            if(that.currentGoal && cancelMessage.id === that.currentGoal.goal_id.id) {
                that.emit('cancel');
            } else if(that.nextGoal && cancelMessage.id === that.nextGoal.goal_id.id) {
                that.nextGoal = null;
            }

            if(that.nextGoal && isEarlier(that.nextGoal.goal_id.stamp,
                                          cancelMessage.stamp)) {
                that.nextGoal = null;
            }
            if(that.currentGoal && isEarlier(that.currentGoal.goal_id.stamp,
                                             cancelMessage.stamp)) {
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

}

SimpleActionServer.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Set action state to succeeded and return to client.
 *
 * @param {Object} result - The result to return to the client.
 */
SimpleActionServer.prototype.setSucceeded = function(result) {
    var resultMessage = new Message({
        status : {goal_id : this.currentGoal.goal_id, status : 3},
        result : result
    });
    this.resultPublisher.publish(resultMessage);

    this.statusMessage.status_list = [];
    if(this.nextGoal) {
        this.currentGoal = this.nextGoal;
        this.nextGoal = null;
        this.emit('goal', this.currentGoal.goal);
    } else {
        this.currentGoal = null;
    }
};

/**
 * Set action state to aborted and return to client.
 *
 * @param {Object} result - The result to return to the client.
 */
SimpleActionServer.prototype.setAborted = function(result) {
    var resultMessage = new Message({
        status : {goal_id : this.currentGoal.goal_id, status : 4},
        result : result
    });
    this.resultPublisher.publish(resultMessage);

    this.statusMessage.status_list = [];
    if(this.nextGoal) {
        this.currentGoal = this.nextGoal;
        this.nextGoal = null;
        this.emit('goal', this.currentGoal.goal);
    } else {
        this.currentGoal = null;
    }
};

/**
 * Send a feedback message.
 *
 * @param {Object} feedback - The feedback to send to the client.
 */
SimpleActionServer.prototype.sendFeedback = function(feedback) {
    var feedbackMessage = new Message({
        status : {goal_id : this.currentGoal.goal_id, status : 1},
        feedback : feedback
    });
    this.feedbackPublisher.publish(feedbackMessage);
};

/**
 * Handle case where client requests preemption.
 */
SimpleActionServer.prototype.setPreempted = function() {
    this.statusMessage.status_list = [];
    var resultMessage = new Message({
        status : {goal_id : this.currentGoal.goal_id, status : 2},
    });
    this.resultPublisher.publish(resultMessage);

    if(this.nextGoal) {
        this.currentGoal = this.nextGoal;
        this.nextGoal = null;
        this.emit('goal', this.currentGoal.goal);
    } else {
        this.currentGoal = null;
    }
};

module.exports = SimpleActionServer;
