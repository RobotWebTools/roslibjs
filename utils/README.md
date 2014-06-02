roslibjs Build Setup
====================

[Grunt](http://gruntjs.com/) is used for building, including concatenating, minimizing, documenting, linting, and testing.

### Install Grunt and its Dependencies

#### Ubuntu

 1. Install Node.js and its package manager, NPM
   * `sudo apt-get install npm phantomjs`
   * `sudo ln -s /usr/bin/nodejs /usr/bin/node`
 2. Install Grunt and the test runner [Karma](http://karma-runner.github.io/)
   * `sudo npm install -g grunt-cli`
   * `sudo rm -rf ~/.npm ~/tmp`
 3. Install the Grunt tasks specific to this project
   * `cd /path/to/roslibjs/utils/`
   * `npm install .`
 4. (Optional) To generate the documentation, you'll need to setup Java. Documentation generation is not required for patches.
   * `echo "export JAVA_HOME=/usr/lib/jvm/default-java/jre" >> ~/.bashrc`
   * `source ~/.bashrc`

#### OS X

 1. Install Node.js and its package manager, NPM
   * Go to [Node.js Downloads](http://nodejs.org/download/)
   * Download and install the Universal pkg file.
 2. Install Grunt and the test runner [Karma](http://karma-runner.github.io/)
   * `sudo npm install -g grunt-cli karma phantomjs`
 3. Install the Grunt tasks specific to this project
   * `cd /path/to/roslibjs/utils/`
   * `npm install .`

### Build with Grunt

Before proceeding, please confirm you have installed the dependencies above.

To run the build tasks:

 1. `cd /path/to/roslibjs/utils/`
 2. `grunt build`

`grunt build` will concatenate and minimize the files under src and replace roslib.js and roslib.min.js in the build directory. It will also run the linter and test cases. This is what [Travis CI](https://travis-ci.org/RobotWebTools/roslibjs) runs when a Pull Request is submitted.

`grunt dev` will watch for any changes to any of the src/ files and automatically concatenate and minimize the files. This is ideal for those developing as you should only have to run `grunt dev` once.

`grunt doc` will rebuild all JSDoc for the project.

### Integration testing

Integration testing launches the ros master, rosbridge and a browser
to test end-to-end communication. Tested under ubuntu only with
chrome. It doesn't work with phantomjs, beacuse it's currently
incompatible with the latest websockets standard that rosbridge uses
(https://github.com/ariya/phantomjs/issues/11018).

 1. Install xvfb and chrome. Adapted from http://www.chrisle.me/2013/08/running-headless-selenium-with-chrome/

```
  # Add Google public key to apt
    wget -q -O - "https://dl-ssl.google.com/linux/linux_signing_key.pub" | sudo apt-key add -

  # Add Google to the apt-get source list
    echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' >> /etc/apt/sources.list

  # Update app-get
    apt-get update

  # Install Chrome and Xvfb
    apt-get -y install google-chrome-stable xvfb

```

 1. Launch xvfb

```
export DISPLAY=:99
Xvfb :99 -screen 0 1366x768x24 -ac &
```

 1. Run tests

```
export DISPLAY=:99
rostest roslibjs_integration test_pubsub.test
```

The tests will report success/failure, but the meaningful output will
go to /tmp/integration_test_log (see integration/test/js_runner for
details). I cut some corners to have it run with rostest.
