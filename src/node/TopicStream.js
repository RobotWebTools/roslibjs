var Topic = require('../core/Topic');
var DuplexStream = require('stream').Duplex;

/**
 * Publish a connected ROS topic to a duplex
 * stream. This stream can be piped to, which will
 * publish to the topic
 */
Topic.prototype.toStream = function(transform) {
    var topic = this;
    var hasTransform = typeof transform === 'function';

    var stream = new DuplexStream({
        objectMode: true
    });
    stream._read = function() {};
    
    // Publish to the topic if someone pipes to stream
    stream._write = function(chunk, encoding, callback) {
        if (hasTransform) {
            chunk = transform(chunk);
        }
        if (chunk) {
            topic.publish(chunk);
        }
        callback();
    };
    
    this.subscribe(function(message) {
        stream.push(message);
    });
    this.on('unsubscribe', stream.push.bind(stream, null));

    return stream;
};

module.exports = Topic;