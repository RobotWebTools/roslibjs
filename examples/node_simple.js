#!/usr/bin/env node

// Connecting to ROS 
var ROSLIB = require('roslib');

var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

ros.on('connection', function() {
console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
console.log('Connection to websocket server closed.');
});

// Publishing a Topic
// ------------------

var cmdVel = new ROSLIB.Topic({
  ros : ros,
  name : '/cmd_vel',
  messageType : 'geometry_msgs/Twist'
});

var twist = new ROSLIB.Message({
linear : {
  x : 0.1,
  y : 0.2,
  z : 0.3
},
angular : {
  x : -0.1,
  y : -0.2,
  z : -0.3
}
});

console.log("Publishing cmd_vel");
cmdVel.publish(twist);
