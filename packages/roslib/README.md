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

### Monitor ROS 2 actions from other clients

`Action.sendGoal()` callbacks track the goal sent by that call. To observe goals
sent by other clients, subscribe to the action's status and feedback topics:

```ts
import {
  Action,
  GoalStatus,
  Ros,
  type ActionFeedbackMessage,
  type action_msgs,
} from "roslib";

const ros = new Ros({ url: "ws://localhost:9090" });
const action = new Action<
  { order: number },
  { partial_sequence: number[] },
  { sequence: number[] }
>({
  ros,
  name: "/fibonacci",
  actionType: "action_tutorials_interfaces/action/Fibonacci",
});

const statusTopic = action.getStatusTopic();
const feedbackTopic = action.getFeedbackTopic();
const onStatus = (message: action_msgs.GoalStatusArray) => {
  for (const goal of message.status_list) {
    console.log(goal.goal_info.goal_id, GoalStatus[goal.status]);
  }
};
const onFeedback = (
  message: ActionFeedbackMessage<{ partial_sequence: number[] }>,
) => {
  console.log(message.goal_id, message.feedback.partial_sequence);
};
statusTopic.subscribe(onStatus);
feedbackTopic.subscribe(onFeedback);

function stopMonitoring() {
  statusTopic.unsubscribe(onStatus);
  feedbackTopic.unsubscribe(onFeedback);
  ros.close();
}
```

Call `stopMonitoring()` when finished. Each method returns a new `Topic` without
subscribing automatically. Keep that instance to manage its callbacks and
lifetime. Feedback includes the ROS goal
UUID alongside the typed feedback payload; it is not the bare payload returned
by `sendGoal`'s feedback callback. UUID bytes are base64 strings in rosbridge JSON
and may be arrays or `Uint8Array` values with other encodings. They are distinct
from the rosbridge request ID returned by `sendGoal()`.

The status topic uses `action_msgs/msg/GoalStatusArray` with ROS 2
`{ sec, nanosec }` timestamps. Feedback message types are derived from either
`package/Action` or `package/action/Action`. Both helpers retain the action's
namespace and use normal `Topic` reconnect behavior.

Status defaults to reliable, transient-local, keep-last depth 1 so a late
observer can request the current status snapshot. Feedback defaults to reliable,
volatile, keep-last depth 10. Both accept subscription options, for example
`action.getFeedbackTopic({ qos: { reliability: "best_effort" }, compression: "cbor" })`
for a server configured to publish best-effort feedback. Explicit QoS requires
rosbridge protocol 2.1.0 or newer; older servers ignore these overrides. Status
and feedback do not provide the result of another client's goal.

See `roslib-examples`' ROS 2 Action Monitor for a runnable browser example.

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
