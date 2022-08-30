var expect = require('chai').expect;
var ROSLIB = require('../..');

var expectedTopics = [
    // '/turtle1/cmd_vel', '/turtle1/color_sensor', '/turtle1/pose',
    // '/turtle2/cmd_vel', '/turtle2/color_sensor', '/turtle2/pose',
    '/tf2_web_republisher/status', '/tf2_web_republisher/feedback',
    // '/tf2_web_republisher/goal', '/tf2_web_republisher/result',
    '/fibonacci/feedback', '/fibonacci/status', '/fibonacci/result'
];

describe('Example topics are live', function(done) {
    it('getTopics', function(done) {
        var ros = new ROSLIB.Ros({
            port: 9090
        });
        ros.getTopics(function(result) {
            expectedTopics.forEach(function(topic) {
                expect(result.topics).to.contain(topic, 'Couldn\'t find topic: ' + topic);
            });
            done();
        });
    });
});