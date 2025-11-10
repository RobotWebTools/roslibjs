ARG ROS_DISTRO=noetic
FROM ros:${ROS_DISTRO}-ros-base

# Copy package.xml and install ROS dependencies
COPY package.xml /workspace/
WORKDIR /workspace
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && \
    rosdep update --include-eol-distros && \
    rosdep install --from-paths . --ignore-src -y

# Copy ROS launch files and test setup
COPY test/examples/ /workspace/test/examples/

# Expose rosbridge websocket port
EXPOSE 9090

# Default command runs the ROS backend for testing
CMD ["bash", "-c", "source /opt/ros/$ROS_DISTRO/setup.bash && bash /workspace/test/examples/setup_examples.bash"]
