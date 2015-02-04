roslibjs [![Build Status](https://api.travis-ci.org/RobotWebTools/roslibjs.png)](https://travis-ci.org/RobotWebTools/roslibjs)
========

#### The Standard ROS JavaScript Library
For full documentation, see [the ROS wiki](http://ros.org/wiki/roslibjs) or check out some [working demos](http://robotwebtools.org/).

[JSDoc](http://robotwebtools.org/jsdoc/roslibjs/current/) can be found on the Robot Web Tools website.

This project is released as part of the [Robot Web Tools](http://robotwebtools.org/) effort.

### Usage
Pre-built files can be found in either [roslib.js](build/roslib.js) or [roslib.min.js](build/roslib.min.js).

Alternatively, you can use the current release via the Robot Web Tools CDN: ([full](http://cdn.robotwebtools.org/roslibjs/current/roslib.js)) | ([min](http://cdn.robotwebtools.org/roslibjs/current/roslib.min.js))

### Troubleshooting

1. Check that connection is established. You can listen to error and
   connection events to report them to console. See
   examples/simple.html for a complete example:

    ros.on('error', function(error) { console.log( error ); });
    ros.on('connection', function() { console.log('Connection made!'); });

1. Check that you have the websocket server is running on
   port 9090. Something like this should do:

    netstat -a | grep 9090

### Dependencies
roslibjs depends on:

[EventEmitter2](https://github.com/hij1nx/EventEmitter2). The current supported version is 0.4.14. The current supported version can be found on the Robot Web Tools CDN: ([full](http://cdn.robotwebtools.org/EventEmitter2/0.4.14/eventemitter2.js)) | ([min](http://cdn.robotwebtools.org/EventEmitter2/0.4.14/eventemitter2.min.js))

### Build
Checkout [CONTRIBUTING.md](CONTRIBUTING.md) for details on building.

### License
roslibjs is released with a BSD license. For full terms and conditions, see the [LICENSE](LICENSE) file.

### Authors
See the [AUTHORS.md](AUTHORS) file for a full list of contributors.
