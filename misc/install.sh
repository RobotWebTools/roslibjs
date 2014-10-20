#!/bin/sh

set -e
if type 'apt-get' > /dev/null; then
  {
    sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++ -qq &&
    exit 0
  }
elif type 'yum' > /dev/null; then
  {
    sudo yum erase cairo &&
    sudo yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel &&
    exit 0
  }
fi

# Build from source (official build steps)
curl https://raw.githubusercontent.com/Automattic/node-canvas/1.1.6/install | sh