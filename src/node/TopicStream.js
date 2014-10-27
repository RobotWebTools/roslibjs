var Topic = require('../core/Topic');
var ReadableStream = require('stream').Readable;

Topic.prototype.toStream = function() {
    var stream = new ReadableStream({
        objectMode: true
    });
    stream._read = function() {};
    
    this.subscribe(function(message) {
        stream.push(message);
    });
    this.on('unsubscribe', stream.push.bind(stream, null));

    return stream;
};

module.exports = Topic;