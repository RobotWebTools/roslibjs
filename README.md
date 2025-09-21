# roslibjs

[![CI](https://github.com/RobotWebTools/roslibjs/actions/workflows/main.yml/badge.svg)](https://github.com/RobotWebTools/roslibjs/actions/workflows/main.yml)

## The Standard ROS JavaScript Library

For full documentation see the [ROS wiki](http://wiki.ros.org/roslibjs).

[JSDoc](https://robotwebtools.github.io/roslibjs) can be found on the Robot Web Tools website.

This project is released as part of the [Robot Web Tools](https://robotwebtools.github.io/) effort.

## Usage

Install roslibjs with any NPM-compatible package manager via, for example,

```bash
npm install roslib
```

~Pre-built files can be found in either [roslib.js](build/roslib.js) or [roslib.min.js](build/roslib.min.js).~

As we are updating to v2, we don't provide pre-built files anymore in the repo.

Alternatively, you can use the v1 release via the [JsDelivr](https://www.jsdelivr.com/) CDN: ([full](https://cdn.jsdelivr.net/npm/roslib@1/build/roslib.js)) | ([min](https://cdn.jsdelivr.net/npm/roslib@1/build/roslib.min.js))



## Quick Start Example

Here’s a minimal example to connect to a ROS master using `roslibjs`:

``` js
import ROSLIB from 'roslib';

// Connect to ROS bridge server
const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
});

// Connection events
ros.on('connection', () => {
  console.log('Connected to websocket server.');
});

ros.on('error', (error) => {
  console.log('Error connecting to websocket server:', error);
});

ros.on('close', () => {
  console.log('Connection to websocket server closed.');
});

// Create a topic object
const cmdVel = new ROSLIB.Topic({
  ros: ros,
  name: '/cmd_vel',
  messageType: 'geometry_msgs/Twist'
});

// Publish a message
const twist = new ROSLIB.Message({
  linear: { x: 0.1, y: 0.0, z: 0.0 },
  angular: { x: 0.0, y: 0.0, z: 0.1 }
});
cmdVel.publish(twist);





## Troubleshooting

1. Check that connection is established. You can listen to error and
   connection events to report them to console. See
   examples/simple.html for a complete example:

   ```js
   ros.on('error', function(error) { console.log( error ); });
   ros.on('connection', function() { console.log('Connection made!'); });
   ```

2. Check that you have the websocket server is running on
   port 9090. Something like this should do:

   ```bash
   netstat -a | grep 9090
   ```

## Dependencies

roslibjs has a number of dependencies. You will need to run:

```bash
npm install
```

Depending on your build environment.

## Build

Checkout [CONTRIBUTING.md](CONTRIBUTING.md) for details on building.

## License

roslibjs is released with a BSD license. For full terms and conditions, see the [LICENSE](LICENSE) file.

## Authors

See the [AUTHORS.md](AUTHORS.md) file for a full list of contributors.
