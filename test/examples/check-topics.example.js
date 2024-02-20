import { describe, it, expect } from 'vitest';
import * as ROSLIB from '../../src/RosLib.js';

var expectedTopics = [
    // '/turtle1/cmd_vel', '/turtle1/color_sensor', '/turtle1/pose',
    // '/turtle2/cmd_vel', '/turtle2/color_sensor', '/turtle2/pose',
    '/tf2_web_republisher/status', '/tf2_web_republisher/feedback',
    // '/tf2_web_republisher/goal', '/tf2_web_republisher/result',
    '/fibonacci/feedback', '/fibonacci/status', '/fibonacci/result'
];

describe('Example topics are live', function() {
    var ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    });
    
    it('getTopics', () => new Promise((done) =>  {
        ros.getTopics(function(result) {
            expectedTopics.forEach(function(topic) {
                expect(result.topics).to.contain(topic, 'Couldn\'t find topic: ' + topic);
            });
            done();
        });
    }));

    var example = ros.Topic({
        name: '/some_test_topic',
        messageType: 'std_msgs/String'
    });

    it('doesn\'t automatically advertise the topic', () => new Promise((done) =>  {
        ros.getTopics(function(result) {
            expect(result.topics).not.to.contain('/some_test_topic');
            example.advertise();
            done();
        });
    }));

    it('advertise broadcasts the topic', () => new Promise((done) =>  {
        ros.getTopics(function(result) {
            expect(result.topics).to.contain('/some_test_topic');
            example.unadvertise();
            done();
        });
    }));

    it('unadvertise will end the topic (if it\s the last around)', () => new Promise((done) =>  {
        console.log('Unadvertisement test. Wait for 15 seconds..');
        setTimeout(function() {
          ros.getTopics(function(result) {
              expect(result.topics).not.to.contain('/some_test_topic');
              done();
          });
        }, 15000);
    }), 20000);
});
