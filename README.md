roslibjs
========

#### The Standard ROS JavaScript Library ####

[![Build Status](https://api.travis-ci.org/RobotWebTools/roslibjs.png)](https://travis-ci.org/RobotWebTools/roslibjs)

For full documentation, see [the ROS wiki](http://ros.org/wiki/roslibjs) or check out some [working demos](http://robotwebtools.org/).

[JSDoc](http://robotwebtools.org/jsdoc/roslibjs/current/) can be found on the Robot Web Tools website.

This project is released as part of the [Robot Web Tools](http://robotwebtools.org/) effort.

### Usage ###
Pre-built files can be found in either [roslib.js](build/roslib.js) or [roslib.min.js](build/roslib.min.js).

Alternatively, you can use the current release via the Robot Web Tools CDN ([full](http://cdn.robotwebtools.org/roslibjs/current/roslib.js)) | ([min](http://cdn.robotwebtools.org/roslibjs/current/roslib.min.js))

### Dependencies ###
roslibjs depends on [EventEmitter2](https://github.com/hij1nx/EventEmitter2). The current supported version is 0.4.11.

The current supported version can be found [in this project](include/EventEmitter2/eventemitter2.js) or on the Robot Web Tools CDN ([full](http://cdn.robotwebtools.org/EventEmitter2/0.4.11/eventemitter2.js)) | ([min](http://cdn.robotwebtools.org/EventEmitter2/0.4.11/eventemitter2.min.js))

### Build ###
To build from source, use the provided [ANT script](utils/build.xml).

The script requires ANT, YUI Compressor, and JSDoc. To install these on an Ubuntu machine, use the following:

    sudo apt-get install ant yui-compressor jsdoc-toolkit

To run the build script, use the following:

    cd utils/
    ant

### License ###
roslibjs is released with a BSD license. For full terms and conditions, see the [LICENSE](LICENSE) file.

### Authors ###
See the [AUTHORS](AUTHORS) file for a full list of contributors.
