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
    var ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    });
    
    it('getTopics', function(done) {
        ros.getTopics(function(result) {
            expectedTopics.forEach(function(topic) {
                expect(result.topics).to.contain(topic, 'Couldn\'t find topic: ' + topic);
            });
            done();
        });
    });

    var example = ros.Topic({
        name: '/some_test_topic',
        messageType: 'std_msgs/String'
    });

    it('doesn\'t automatically advertise the topic', function(done) {
        ros.getTopics(function(result) {
            expect(result.topics).not.to.contain('/some_test_topic');
            example.advertise();
            done();
        });
    });

    it('advertise broadcasts the topic', function(done) {
        ros.getTopics(function(result) {
            expect(result.topics).to.contain('/some_test_topic');
            example.unadvertise();
            done();
        });
    });

    it('unadvertise will end the topic (if it\s the last around)', function(done) {
        console.log("Unadvertisement test. Wait for 15 seconds..");
        this.timeout(20000);
        setTimeout(function() {
          ros.getTopics(function(result) {
              expect(result.topics).not.to.contain('/some_test_topic');
              done();
          });
        }, 15000);
    });
});
