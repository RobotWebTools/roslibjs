'use strict';

module.exports = function(grunt) {

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      dist: {
        src: ['./src/RosLibBrowser.js'],
        dest: './build/roslib.js'
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      files: [
        './Gruntfile.js',
        './src/**/*.js'
      ]
    },
    karma: {
      options: {
        singleRun: true,
        browsers: process.env.CI ? ['FirefoxHeadless'] : ['Firefox']
      },
      test: {
        configFile: './test/karma.conf.js',
      },
      examples: {
        configFile: './test/examples/karma.conf.js',
      },
      workersocket: {
        configFile: './test/workersocket/karma.conf.js',
      },
    },
    mochaTest: {
      options: {
          reporter: 'spec',
          timeout: 5000
      },
      test: {
        src: ['./test/*.test.js']
      },
      examples: {
        src: ['./test/examples/*.js']
      },
      tcp: {
        src: ['./test/tcp/*.js']
      }
    },
    uglify: {
      options: {
        report: 'min'
      },
      build: {
        src: './build/roslib.js',
        dest: './build/roslib.min.js'
      }
    },
    watch: {
      dev: {
        options: {
          interrupt: true
        },
        files: [
          './src/**/*.js'
        ],
        tasks: ['browserify']
      },
      build_and_watch: {
        options: {
          interrupt: true
        },
        files: [
          'Gruntfile.js',
          '.jshintrc',
          './src/**/*.js'
        ],
        tasks: ['build']
      }
    },
    clean: {
      options: {
        force: true
      },
      doc: ['./doc']
    },
    jsdoc: {
      doc: {
        src: [
          './src/**/*.js'
        ],
        options: {
          destination: './doc',
          private: false
        }
      }
    }
  });

  grunt.registerTask('dev', ['browserify', 'watch']);
  grunt.registerTask('test', ['jshint', 'mochaTest:test', 'karma:test']);
  grunt.registerTask('test-examples', ['mochaTest:examples', 'karma:examples']);
  grunt.registerTask('test-tcp', ['mochaTest:tcp']);
  grunt.registerTask('test-workersocket', ['karma:workersocket']);
  grunt.registerTask('build', ['browserify', 'uglify']);
  grunt.registerTask('build_and_watch', ['watch']);
  grunt.registerTask('doc', ['clean', 'jsdoc']);
};
