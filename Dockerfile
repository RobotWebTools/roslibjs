FROM ros:kinetic-ros-core

ENV ROS_DISTRO=kinetic
# Dependencies for rosbridge
RUN apt update && apt-get install -y ros-$ROS_DISTRO-rosbridge-server ros-$ROS_DISTRO-tf2-web-republisher ros-$ROS_DISTRO-common-tutorials ros-$ROS_DISTRO-rospy-tutorials ros-$ROS_DISTRO-actionlib-tutorials
RUN apt install nodejs npm

# Install nvm, Node.js and node-gyp
ENV NODE_VERSION v4.2.6
RUN wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash \
    && . $HOME/.nvm/nvm.sh \
    && nvm install $NODE_VERSION && nvm alias default $NODE_VERSION \
    && npm install -g node-gyp

RUN echo "source /opt/ros/kinetic/setup.bash" >> $HOME/.bashrc
ENV PATH /bin/versions/node/$NODE_VERSION/bin:$PATH

