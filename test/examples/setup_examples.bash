#! /usr/bin/env bash

if command -v rosrun 2>/dev/null
then
    echo "Shutting everything down"
    pgrep -f "[r]os" | xargs kill -9
    sleep 1

    echo "Starting roscore and various examples in background processes"
    roslaunch examples/setup_examples.launch > roslaunch.log &

    LAUNCHED=false
    for i in {1..10}
    do
        echo "Waiting for /hello_world_publisher...$i"
        sleep 1
        rostopic info /listener > /dev/null && LAUNCHED=true && break
    done
    if [ $LAUNCHED == true ]
    then
        echo "Ready for lift off"
        exit 0
    else
        echo "/hello_world_publisher not launched"
        exit 1
    fi
else
    echo "Couldn't find ROS on path (try to source it)"
    # shellcheck disable=SC2016
    echo 'source /opt/ros/$ROS_DISTRO/setup.bash'
    exit 1
fi
