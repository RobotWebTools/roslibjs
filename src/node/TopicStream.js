var Topic = require('../core/Topic');
var DuplexStream = require('stream').Duplex;

/**
 * Publish a connected ROS topic to a duplex
 * stream. This stream can be piped to, which will
 * publish to the topic
 *
 * @options
 *   * subscribe: whether to subscribe to the topic and start emitting
 *              Data
 *   * publish: whether to register the stream as a publisher to the topic
 *   * transform: a function to change the data to be published
 *              or filter it if false is returned
 */
Topic.prototype.toStream = function(options) {
    options = options || {subscribe: true, publish: true};

    var topic = this;
    var hasTransform = typeof options.transform === 'function';

    var stream = new DuplexStream({
        objectMode: true
    });
    stream._read = function() {};
    
    // Publish to the topic if someone pipes to stream
    stream._write = function(chunk, encoding, callback) {
        if (hasTransform) {
            chunk = options.transform(chunk);
        }
        if (chunk === false) {
            topic.publish(chunk);
        }
        callback();
    };
    
    if (options.subscribe) {
        this.subscribe(function(message) {
            stream.push(message);
        });
        this.on('unsubscribe', stream.push.bind(stream, null));
    }

    if (options.publish) {
        this.advertise();
    }

    return stream;
};

module.exports = Topic;