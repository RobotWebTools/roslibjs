roslibjs Build Setup
====================

[Grunt](http://gruntjs.com/) is used for building, including concatenating, minimizing, documenting, linting, and testing.

### Install Grunt and its Dependencies

 1. Install [Node.js](http://nodejs.org/) for your environment
 2. Install the build task runner, [Grunt](http://gruntjs.com/)
 	
 	```sh
	$ [sudo] npm install -g grunt
 	```

 3. Install the [Cairo](http://cairographics.org/) graphics library
 	- [System specific instructions](https://github.com/Automattic/node-canvas/wiki/_pages)
 4. Install the dependencies and build dependencies
	
	```sh
	$ cd /path/to/roslibjs/
   	$ [sudo] npm install
	```
	

#### Easy installation for Ubuntu
`cd` to your local copy of this project.

```sh
# Install Node.js and NPM
curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-get install nodejs

# Install Cairo
sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

# Install this project's Deps
sudo npm install
```

### Build with Grunt

Before proceeding, please confirm you have installed the dependencies above.

To run the build tasks:

 1. `cd /path/to/roslibjs/`
 2. `grunt build`

`grunt build` will concatenate and minimize the files under src and replace roslib.js and roslib.min.js in the build directory. It will also run the linter and test cases. This is what [Travis CI](https://travis-ci.org/RobotWebTools/roslibjs) runs when a Pull Request is submitted.

`grunt dev` will watch for any changes to any of the src/ files and automatically concatenate and minimize the files. This is ideal for those developing as you should only have to run `grunt dev` once.

`grunt doc` will rebuild all JSDoc for the project.
