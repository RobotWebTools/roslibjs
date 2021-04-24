#! /usr/bin/env bash

# Copyright (c) 2017 Intel Corporation. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

pushd "$(dirname "$0")" > /dev/null

# Set up Xfvb for Firefox headless testing
if ! timeout 1s xset q &>/dev/null
then
    echo "Starting Xvfb"
    export DISPLAY=:99.0
    Xvfb :99 -ac &
fi

bash examples/setup_examples.bash

echo "rostopic list"
rostopic list
echo "npm install"
npm install
echo "npm run build"
npm run build
echo "npm test"
npm test
echo "npm run test-examples"
npm run test-examples
echo "npm run test-workersocket"
npm run test-workersocket

echo "Checking build folder is up-to-date with library"
changed_build_files=$(git -C "$(git rev-parse --show-toplevel)" diff --name-only HEAD -- build)
if [ -n "$changed_build_files" ]
then
    echo -e "\e[1m\e[31mBuild folder is out-of-sync with library. Build library, npm run build, and (ammend) commit\e[0m"
    exit 1
else
    echo -e "\e[1m\e[32mBuild folder is up-to-date with library\e[0m"
fi
