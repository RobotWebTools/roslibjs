if command -v rosrun 2>/dev/null; then
    echo "Shutting everything down"
    ps aux | grep ros | awk '{print $2}' | xargs kill -9
    sleep 1

    echo "Starting roscore and various examples in background processes"

    nohup roscore > /dev/null 2>&1&
    sleep 2
    nohup roslaunch turtle_tf turtle_tf_demo.launch > /dev/null 2>&1&
    nohup rosrun tf2_web_republisher tf2_web_republisher > /dev/null 2>&1&
    nohup rosrun actionlib_tutorials fibonacci_server > /dev/null 2>&1&
    nohup rosrun rospy_tutorials add_two_ints_server > /dev/null 2>&1&
    nohup rostopic pub /listener std_msgs/String "Hello, World" > /dev/null 2>&1&
    # wait a moment then start up bridge
    sleep 3
    nohup roslaunch rosbridge_server rosbridge_websocket.launch > /dev/null 2>&1&
    sleep 3
    echo "Ready for lift off"
else
    echo "Couldn't find ROS on path (try to source it)"
    echo "source /opt/ros/indigo/setup.bash"
fi