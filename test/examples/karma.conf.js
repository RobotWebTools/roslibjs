module.exports = function(config) {
	config.set({

		// Base path, that will be used to resolve files and exclude
		basePath: '',

		// Testing frameworks
		frameworks: ['mocha', 'chai'],

		// List of files / patterns to load in the browser
		files: [
			"../../node_modules/eventemitter2/lib/eventemitter2.js",
			"../../build/roslib.js",
			"../require-shim.js",
			"*.js"
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


		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		browsers: ['Firefox'],


		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,
    browserNoActivityTimeout: 30000,

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: true
	});
};
