module.exports = function(config) {
	config.set({

		// Base path, that will be used to resolve files and exclude
		basePath: '../../',

		// Testing frameworks
		frameworks: ['mocha', 'chai'],

		// List of files / patterns to load in the browser
		files: [
			"../../node_modules/eventemitter2/lib/eventemitter2.js",
			"../../build/roslib.js",
			"../require-shim.js",

			{pattern: 'test/workersocket/*.example.js', type: 'module'},
		],

		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit'
		reporters: ['progress'],


		// web server port
		port: 9876,


		// cli runner port
		runnerPort: 9200,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, MARK, OFF
		logLevel: "DEBUG",


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,


    // Start these browsers (this gets overridden in Gruntfile).
		browsers: ['Firefox'],


    // Add the ChromeHeadlessNoSandbox browser for use on CI
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },


		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,
    browserNoActivityTimeout: 30000,

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: true
	});
};
