ARG ROS_DISTRO=melodic
FROM ros:$ROS_DISTRO-ros-core

ARG CI=true
ENV CI=$CI

# Dependencies for rosbridge
RUN apt update && apt-get install -y firefox git wget ros-$ROS_DISTRO-rosbridge-server ros-$ROS_DISTRO-tf2-web-republisher ros-$ROS_DISTRO-common-tutorials ros-$ROS_DISTRO-rospy-tutorials ros-$ROS_DISTRO-actionlib-tutorials

# Install nvm, Node.js and node-gyp
ARG NODE_VERSION=14
RUN git clone -b v0.38.0 --single-branch --depth 1 https://github.com/nvm-sh/nvm.git $HOME/.nvm \
    && echo ". $HOME/.nvm/nvm.sh" && . $HOME/.nvm/nvm.sh \
    && echo "nvm install $NODE_VERSION --no-progress" && nvm install $NODE_VERSION --no-progress \
    && echo "nvm alias default $NODE_VERSION" && nvm alias default $NODE_VERSION \
    && npm install -g node-gyp

RUN echo "source /opt/ros/$ROS_DISTRO/setup.bash" >> $HOME/.bashrc
ENV PATH=/bin/versions/node/$NODE_VERSION/bin:$PATH
