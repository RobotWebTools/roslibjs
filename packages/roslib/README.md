# roslibjs

[![CI](https://github.com/RobotWebTools/roslibjs/actions/workflows/main.yml/badge.svg)](https://github.com/RobotWebTools/roslibjs/actions/workflows/main.yml)

## The Standard ROS JavaScript Library

[JSDoc](https://robotwebtools.github.io/roslibjs) can be found on the Robot Web Tools website.

This project is released as part of the [Robot Web Tools](https://robotwebtools.github.io/) effort.

## Usage

Install roslibjs with any NPM-compatible package manager via, for example,

```bash
npm install roslib
```

## Troubleshooting

1. Check that connection is established. You can listen to error and
   connection events to report them to console.

   ```js
   ros.on("error", function (error) {
     console.log(error);
   });
   ros.on("connection", function () {
     console.log("Connection made!");
   });
   ```

   Check out the `roslib-examples` package for some complete examples!

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

## Development

roslibjs tries to keep the development process simple by storing all relevant tasks as scripts in the package.json file.
Some useful ones are as follows:

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

The tests build and start a rosbridge backend in Docker for the ROS distro in
`ROS_DISTRO` (default `noetic`). To use a backend you started yourself instead,
for example while debugging, set `ROSLIB_EXTERNAL_BACKEND`. The tests then expect
rosbridge on `ws://localhost:9090` and leave it running afterwards. Set
`ROS_DISTRO` to match it, since some tests are distro-specific:

```bash
# Same backend the tests use, from packages/roslib
docker build --build-arg ROS_DISTRO=humble -t roslibjs-test:humble .
docker run --rm -p 9090:9090 roslibjs-test:humble

# In another terminal
ROSLIB_EXTERNAL_BACKEND=1 ROS_DISTRO=humble npm run test
```

### Linting

```bash
npm run lint
```

## License

roslibjs is released with a BSD license. For full terms and conditions, see the [LICENSE](LICENSE) file.

## Authors

See the `contributors` section of the [package.json](package.json) file for a full list of contributors.
