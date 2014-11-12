#!/bin/sh

set -e

#if type 'apt-get' > /dev/null; then

if python ./misc/cairo_check.py; then
  exit 0
fi

# for OSX
#if type 'ldconfig' > /dev/null; && $(ldconfig -p | grep cairo)? -eq 1 then
#    exit 0
#fi

if [ $(dpkg-query -W -f='${Status}' libcairo2-dev 2>/dev/null | grep -c "ok installed") -eq 0 ]; then
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
#curl https://raw.githubusercontent.com/Automattic/node-canvas/1.1.6/install | sh
