export = SocketIO;
declare class SocketIO {
    constructor(options: any, Ros: any);
    socketio: any;
    socket: any;
    sendToFront(name: any, event: any): (event: any) => void;
    sendToRosbridge(msg: any): void;
}
