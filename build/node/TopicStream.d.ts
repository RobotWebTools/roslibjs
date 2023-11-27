export = TopicStream;
declare class TopicStream extends Topic<any> {
    constructor(options: {
        ros: import("../core/Ros");
        name: string;
        messageType: string;
        compression?: string | undefined;
        throttle_rate?: number | undefined;
        queue_size?: number | undefined;
        latch?: boolean | undefined;
        queue_length?: number | undefined;
        reconnect_on_close?: boolean | undefined;
    });
    /**
     * Publish a connected ROS topic to a duplex
     * stream. This stream can be piped to, which will
     * publish to the topic.
     *
     * @param {Object} options
     * @param {boolean} [options.subscribe=true] - The flag to indicate whether to subscribe to the topic and start emitting data or not.
     * @param {boolean} [options.publish=true] - The flag to indicate whether to register the stream as a publisher to the topic or not.
     * @param {function} [options.transform] - A function to change the data to be published or filter it if false is returned.
     */
    toStream(options: {
        subscribe?: boolean | undefined;
        publish?: boolean | undefined;
        transform?: Function | undefined;
    }): DuplexStream;
}
import Topic = require("../core/Topic");
import DuplexStream_1 = require("stream");
import DuplexStream = DuplexStream_1.Duplex;
