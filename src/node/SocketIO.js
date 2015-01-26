var io = require('socket.io');

function SocketIO(options, Ros){
    this.socketio = null;
    this.socket = Ros.socket;
    if (options.http) {
        this.socketio = io(options.http);
    }else if(options.socketio){
        this.socketio = options.socketio;
    }

    var that = this;

    this.socketio.on('connection', function(socket){
      socket.on('operation', that.sendToRosbridge.bind(that));
    });

    Ros.on('connection', function(){
        that.socket.on('message', that.sendToFront('data').bind(that))
          .on('close', that.sendToFront('close').bind(that))
          .on('error', that.sendToFront('error').bind(that))
          .on('connect', that.sendToFront('connect').bind(that));
    });

    return this.socketio;
}

SocketIO.prototype.sendToFront = function(name, event){
    return function(event){
        this.socketio.emit(name, event);
    };
};

SocketIO.prototype.sendToRosbridge = function(msg){
    this.socket.send(msg);
};

module.exports = SocketIO;