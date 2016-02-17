/**
 * @fileOverview ROSLIB Node exclusive extensions 
 */
var assign = require('object-assign');

module.exports = assign(require('./RosLib'), {
  Ros: require('./node/RosTCP.js'),
  Topic: require('./node/TopicStream')
});