var expect = require('chai').expect;
var ROSLIB = require('../..');

var ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
});

var example = ros.Topic({
    name: '/test_topic',
    messageType: 'std_msgs/String'
});

function format(msg) {
    return {data: msg};
}
var messages = ['1', '2', '3', '4'].map(format);

describe('Topics Example', function() {
    this.timeout(1000);

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


    it('Listening to a topic & unsubscribes', function(done) {
        var topic = createAndStreamTopic('/echo/test');
        var expected = messages.slice();

        topic.subscribe(function(message) {
            expect(message).to.be.instanceof(ROSLIB.Message);
            expect(message).to.be.eql(expected.shift());
        });

        topic.on('unsubscribe', done);
    });
});

if (ROSLIB.Topic.prototype.toStream) {
    var TransformStream = require('stream').Transform;
    describe('Topic Streams are readable and writable', function() {
        this.timeout(1000);

        function createAndStreamTopic(topicName) {
            var stream = new TransformStream({objectMode: true});
            var topic = ros.Topic({
                name: topicName,
                messageType: 'std_msgs/String'
            });

            var idx = 0;
            function emit() {
                setTimeout(function() {
                    stream.push(messages[idx++]);
                    if (idx < messages.length) {
                        emit();
                    } else {
                        stream.end();
                        topic.unsubscribe();
                        topic.unadvertise();
                    }
                }, 50);
            }
            emit();

            stream.pipe(topic.toStream());
            return topic;
        }

        it('Topic.toStream()', function(done) {
            var stream = createAndStreamTopic('/echo/test-stream').toStream();
            var expected = messages.slice();

            expect(stream).to.be.instanceof(require('stream'));
            stream.on('data', function(message) {
                expect(message).to.be.eql(expected.shift());
            });
            stream.on('end', done);
        });
    });
}