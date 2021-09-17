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
      {pattern: 'test/chai.js', serve: true, included: false},
      {pattern: 'build/roslib.esm.js', serve: true, included: false},
      
      // Load Chai as a global, then the ./test/chai.js shim module exports the global for test code in the browser.
      // 'node_modules/chai/chai.js',

      // Polyfill for <script type="importmap"> in Firefox and Safari, which is
      // useful for shimming ES modules. Chrome and Edge natively support
      // importmap already.
      'test/es-module-shim-config.js',
      'https://ga.jspm.io/npm:es-module-shims@0.14.0/dist/es-module-shims.js',

      // This file maps import specifiers to module shims.
      'test/importmap.js',

      // 'node_modules/eventemitter2/lib/eventemitter2.js',
      // 'node_modules/cbor-js/cbor.js',
      // 'src/util/cborTypedArrayTags.js',

      // 'build/roslib.js',

      // 'test/require-shim.js',
      
      // {pattern: 'test/*.test.js', type: 'module'},
      {pattern: 'test/quaternion.test.js', type: 'module'},
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
