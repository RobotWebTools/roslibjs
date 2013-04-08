roslibjs build setup
====================

[Grunt](http://gruntjs.com/) is used for building, including concatenating,
minimizing, documenting, linting, and testing.

### Install Grunt and its dependencies

#### Ubuntu

 1. Install Node.js and its package manager, NPM
   * `sudo apt-get install python-software-properties`
   * `sudo add-apt-repository ppa:chris-lea/node.js`
   * `sudo apt-get install nodejs`
 2. Install Grunt and the test runner [Karma](http://karma-runner.github.io/)
   * `sudo npm install -g grunt-cli karma`
 3. Install the Grunt tasks specific to this project
   * `cd /path/to/roslibjs/utils/`
   * `npm install .`
 4. (Optional) To generate the documentation, you'll need Java and JSDoc. Documentation generation is not required for patches.
   * `sudo apt-get install jsdoc-toolkit`

#### OS X

 1. Install Node.js and its package manager, NPM
   * Go to [Node.js Downloads](http://nodejs.org/download/)
   * Download and install the Universal pkg file.
 2. Install Grunt and the test runner [Karma](http://karma-runner.github.io/)
   * `sudo npm install -g grunt-cli karma`
 3. Install the Grunt tasks specific to this project
   * `cd /path/to/roslibjs/utils/`
   * `npm install .`

### Build with Grunt

Before proceeding, please confirm you have installed the dependencies above.

To run the build tasks:

 1. `cd /path/to/roslibjs/utils/`
 2. `grunt build`

`grunt build` will concatenate and minimize the files under src and replace
roslib.js and roslib.min.js in the build directory. It will also run the linter
and test cases. This is what [Travis
CI](https://travis-ci.org/RobotWebTools/roslibjs) runs when a Pull Request is
submitted.

`grunt dev` will watch for any changes to any of the src/ files and
automatically concatenate and minimize the files. This is ideal for those
developing as you should only have to run `grunt dev` once.

