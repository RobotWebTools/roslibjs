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
        jshintrc: '.jshintrc'
      },
      files: [
        './Gruntfile.js',
        './src/**/*.js'
      ]
    },
    karma: {
      build: {
        configFile: './test/karma.conf.js',
        singleRun: true,
        browsers: ['Firefox']
      }
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
          destination: './doc'
        }
      }
    }
  });

  grunt.registerTask('dev', ['browserify', 'watch']);
  grunt.registerTask('test', ['jshint', 'mochaTest:test', 'browserify', 'karma']);
  grunt.registerTask('build', ['test', 'uglify']);
  grunt.registerTask('build_and_watch', ['watch']);
  grunt.registerTask('doc', ['clean', 'jsdoc']);
};
