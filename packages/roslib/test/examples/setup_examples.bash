#! /usr/bin/env bash

# Change to the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if ROS 1 is available
check_ros1() {
    command -v rosrun >/dev/null 2>&1
}

# Function to check if ROS 2 is available
check_ros2() {
    command -v ros2 >/dev/null 2>&1
}

# Function to setup ROS 1
setup_ros1() {
    echo "Setting up ROS 1 environment"

    echo "Shutting everything down"
    pgrep -f "ros" | xargs kill -9 2>/dev/null
    sleep 1

    echo "Starting roscore and various examples"
    roslaunch setup_examples.launch
}

# Function to setup ROS 2
setup_ros2() {
    echo "Setting up ROS 2 environment"

    echo "Shutting everything down"
    pgrep -f "ros2\|launch" | xargs kill -9 2>/dev/null
    sleep 1

    echo "Starting ROS 2 launch file and various examples"
    ros2 launch setup_examples_ros2.launch.xml
}

# Main logic
if [ "$ROS_VERSION" == "2" ]; then
    if check_ros2; then
        setup_ros2
    else
        echo "ROS_VERSION is set to 2 but ROS 2 is not available on path"
        # shellcheck disable=SC2016
        echo 'Make sure to source ROS 2: source /opt/ros/$ROS_DISTRO/setup.bash'
        exit 1
    fi
elif [ "$ROS_VERSION" == "1" ] || [ -z "$ROS_VERSION" ]; then
    if check_ros1; then
        setup_ros1
    else
        echo "Couldn't find ROS 1 on path (try to source it)"
        # shellcheck disable=SC2016
        echo 'source /opt/ros/$ROS_DISTRO/setup.bash'
        exit 1
    fi
else
    echo "Unknown ROS_VERSION: $ROS_VERSION"
    echo "Please set ROS_VERSION to either '1' or '2'"
    exit 1
fi
