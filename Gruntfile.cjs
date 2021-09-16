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
      }
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

  // The above load-grunt-tasks does not automatically detect gruntify-eslint, so load it manually here.
  // grunt.loadNpmTasks('gruntify-eslint');

  grunt.registerTask('dev', ['shell:build', 'watch']);
  grunt.registerTask('test', ['lint', 'mochaTest:test', 'karma:test']);
  grunt.registerTask('test-examples', ['mochaTest:examples', 'karma:examples']);
  grunt.registerTask('test-tcp', ['mochaTest:tcp']);
  grunt.registerTask('test-workersocket', ['karma:workersocket']);
  grunt.registerTask('build', ['lint', 'shell:build']);
  grunt.registerTask('build_and_watch', ['watch']);
  grunt.registerTask('doc', ['clean', 'jsdoc']);
  grunt.registerTask('lint', ['shell:lint']);
  grunt.registerTask('lint-fix', ['shell:lint-fix',]);
};
