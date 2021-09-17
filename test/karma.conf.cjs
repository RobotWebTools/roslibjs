// Karma configuration

module.exports = function(config) {
  config.set({

    // Base path, that will be used to resolve files and exclude
    basePath: '../',

    // Testing frameworks
    frameworks: ['mocha', 'chai'],

    // List of files / patterns to load in the browser
    files: [
      // Make some file available to be fetched/imported, but not included in the HTML.
      {pattern: 'build/roslib.esm.js', serve: true, included: false},
      {pattern: 'test/util/shim/chai.js', serve: true, included: false},
      {pattern: 'src/util/shim/xmldom.js', serve: true, included: false},
      {pattern: 'src/util/shim/cbor.js', serve: true, included: false},
      {pattern: 'src/util/cborTypedArrayTags.js', serve: true, included: false},

      // This file maps some import specifiers to our module shims.
      'test/util/write-importmap.js',

      // Installs cbor-js in a global CBOR variable so that our shim/cbor.js shim picks it up.
      'node_modules/cbor-js/cbor.js',
      
      {pattern: 'test/*.test.js', type: 'module'},
    ],

    client: {
        mocha: {
            timeout: 10000
        }
    },

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
    logLevel: 'INFO',


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


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
