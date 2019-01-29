#!/bin/bash
#
# Copyright (c) 2017 Intel Corporation. All rights reserved.

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

pushd $(dirname $0) > /dev/null

# Set up Xfvb for Firefox headless testing
#export DISPLAY=:99.0
#sh -e /etc/init.d/xvfb start
#Xvfb :99 -ac &

source /opt/ros/kinetic/setup.bash
sh examples/setup_examples.sh

rostopic list
npm install
npm run test-examples
npm run test-workersocket
