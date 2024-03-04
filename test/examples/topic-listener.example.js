import { describe, it, expect } from 'vitest';
import * as ROSLIB from '../../src/RosLib.js';

var ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
});

function format(msg) {
    return {data: msg};
}
var messages = ['1', '2', '3', '4'].map(format);

describe('Topics Example', function() {

    function createAndStreamTopic(topicName) {
        var topic = ros.Topic({
            name: topicName,
            messageType: 'std_msgs/String'
        });
        var idx = 0;

        function emit() {
            setTimeout(function() {
                topic.publish(messages[idx++]);
                if (idx < messages.length) {
                    emit();
                } else {
                    topic.unsubscribe();
                    topic.unadvertise();
                }
            }, 50);
        }
        emit();

        return topic;
    }


    it('Listening to a topic & unsubscribes', () => new Promise((done) => {
        var topic = createAndStreamTopic('/echo/test');
        var expected = messages.slice();

        topic.subscribe(function(message) {
            expect(message).to.be.eql(expected.shift());
        });

        topic.on('unsubscribe', done);
    }));
}, 1000);
