/* global module, require, process */

'use strict';

module.exports = function(grunt) {

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    shell: {
      build: {
        command: 'rollup -c'
      },
      lint: {
        command: 'eslint Gruntfile.cjs ./src/*.js ./src/**/*.js ./test/*.js'
      },
      'lint-fix': {
        command: 'eslint --fix Gruntfile.cjs ./src/*.js ./src/**/*.js ./test/*.js'
      },
      mochaTest: {
        command: 'mocha ./test/*.test.js'
      },
      mochaExamples: {
        command: 'mocha ./test/examples/*.js'
      },
      mochaTcp: {
        command: 'mocha ./test/tcp/*.js'
      },
    },
    karma: {
      options: {
        singleRun: true,
        browsers: process.env.CI ? ['ChromeHeadless'] : ['Chrome']
      },
      test: {
        configFile: './test/karma.conf.cjs',
      },
      examples: {
        configFile: './test/examples/karma.conf.cjs',
      },
      workersocket: {
        configFile: './test/workersocket/karma.conf.cjs',
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
        tasks: ['shell:build']
      },
      build_and_watch: {
        options: {
          interrupt: true
        },
        files: [
          'Gruntfile.cjs',
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

  grunt.registerTask('dev', ['shell:build', 'watch']);
  grunt.registerTask('test', ['lint', 'shell:mochaTest', 'karma:test']);
  grunt.registerTask('test-examples', ['shell:mochaExamples', 'karma:examples']);
  grunt.registerTask('test-tcp', ['shell:mochaTcp']);
  grunt.registerTask('test-workersocket', ['karma:workersocket']);
  grunt.registerTask('build', ['lint', 'shell:build']);
  grunt.registerTask('build_and_watch', ['watch']);
  grunt.registerTask('doc', ['clean', 'jsdoc']);
  grunt.registerTask('lint', ['shell:lint']);
  grunt.registerTask('lint-fix', ['shell:lint-fix',]);
};
