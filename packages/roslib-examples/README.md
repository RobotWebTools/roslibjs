# roslib-examples

## Running the examples

Run `npm start` to view the examples in your browser.

The ROS 2 Action Monitor subscribes to status and feedback from all clients of
an action. Start the commands shown on its page, connect, and send goals from
another terminal or the ROS 2 Action Client example. You can also connect after a
goal has started: the status topic requests transient-local durability to receive
the action server's latest snapshot. Explicit QoS requires rosbridge protocol
2.1.0 or newer. Disconnecting removes both subscriptions; reconnecting starts a
fresh display, bounded to 100 goals.
