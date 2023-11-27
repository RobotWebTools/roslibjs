export = RosTCP;
/**
 * Same as core Ros except supports TCP connections.
 * This can also receive a socket.io instance (options.socketio) or server instance (option.http)
 * to connect to the front using socket.io.
 * @private
 */
declare class RosTCP extends Ros {
    constructor(options: any);
    encoding: any;
    io: SocketIO | undefined;
    /**
     * Connect to a live socket.
     *
     * @param {string|number|Object} url - Address and port to connect to (see http://nodejs.org/api/net.html).
     *     Format: {host: String, port: Int} or (port:Int) or "host:port".
     */
    connect(url: string | number | any): void;
    Topic(options: any): TopicStream;
}
import Ros = require("../core/Ros");
import SocketIO = require("./SocketIO");
import TopicStream = require("./TopicStream");
