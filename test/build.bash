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

bash examples/setup_examples.bash

echo -e "\e[1m\e[35mrostopic list\e[0m"
rostopic list
echo -e "\e[1m\e[35mnpm install\e[0m"
npm install
echo -e "\e[1m\e[35mnpm run build\e[0m"
npm run build
echo -e "\e[1m\e[35mnpm test\e[0m"
npm test
echo -e "\e[1m\e[35mnpm run test-examples\e[0m"
npm run test-examples
echo -e "\e[1m\e[35mnpm run test-workersocket\e[0m"
npm run test-workersocket
