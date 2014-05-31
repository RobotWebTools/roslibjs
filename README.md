roslibjs - node version [![Build Status](https://api.travis-ci.org/RobotWebTools/roslibjs.png)](https://travis-ci.org/RobotWebTools/roslibjs)
========

### Warning. It is highly experimental! Some modules may not be available ####

#### The Standard ROS JavaScript Library
For full documentation, see [the ROS wiki](http://ros.org/wiki/roslibjs) or check out some [working demos](http://robotwebtools.org/).

[JSDoc](http://robotwebtools.org/jsdoc/roslibjs/current/) can be found on the Robot Web Tools website.

This project is released as part of the [Robot Web Tools](http://robotwebtools.org/) effort.

### Installation

* Install [node-canvas](https://github.com/learnboost/node-canvas) dependency
 * https://github.com/learnboost/node-canvas/wiki
 * On OSX, you may need `export PKG_CONFIG_PATH=/opt/X11/lib/pkgconfig` before `npm install canvas` per `https://github.com/selaux/node-sprite-generator/issues/23`

* Install roslib

> npm install roslib

### Usage

> var Ros = require('roslib').Ros

### Dependencies

roslibjs depends on:

* [nodejs-websocket](https://github.com/sitegui/nodejs-websocket)
* [eventemitter2](https://github.com/hij1nx/EventEmitter2)
* [canvas](https://github.com/learnboost/node-canvas)
* [xpath](https://github.com/goto100/xpath)
* [xmldom](https://github.com/jindw/xmldom)


### Build
Checkout [README_GRUNT.md](README_GRUNT.md) for details on building.

### License
roslibjs is released with a BSD license. For full terms and conditions, see the [LICENSE](LICENSE) file.

### Authors

See the [AUTHORS.md](AUTHOR.md) file for a full list of contributors.
