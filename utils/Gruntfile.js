module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      build: {
        src  : ['../src/*.js', '../src/**/*.js'],
        dest : '../build/roslib.js'
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      files: [
        'Gruntfile.js',
        '../build/roslib.js'
      ]
    },
    karma: {
      build: {
        configFile: '../test/karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      },
      integration: {
        configFile: '../integration/test/karma.conf.js',
        singleRun: true,
        // We can't use phantomjs right now. It's incompatible with websockets rosbridge uses
        // https://github.com/ariya/phantomjs/issues/11018
        browsers: ['Chrome'],

        // Change allow_draft76 to True in rosbridge_server/src/tornado/websocket.py
        //browsers: ['PhantomJS'],

        options: {
          files:[
            "../../utils/node_modules/grunt-karma/node_modules/karma/adapter/lib/mocha.js",
            "../../utils/node_modules/grunt-karma/node_modules/karma/adapter/mocha.js",
            "../../include/EventEmitter2/eventemitter2.js",
            "../../build/roslib.js",
            "../../test/chai.js",
            "../../utils/node_modules/chai-as-promised/lib/chai-as-promised.js",
            "<%= grunt.option('jsFiles') %>"
          ]
        }
      }
    },
    uglify: {
      options: {
        report: 'min'
      },
      build: {
        src: '../build/roslib.js',
        dest: '../build/roslib.min.js'
      }
    },
    watch: {
      dev: {
        options: {
          interrupt: true
        },
        files: [
          '../src/*.js',
          '../src/**/*.js'
        ],
        tasks: ['concat']
      },
      build_and_watch: {
        options: {
          interrupt: true
        },
        files: [
          'Gruntfile.js',
          '.jshintrc',
          '../src/*.js',
          '../src/**/*.js'
        ],
        tasks: ['build']
      }
    },
    clean: {
      options: {
        force: true
      },
      doc: ['../doc']
    },
    jsdoc: {
      doc: {
        src: [
          '../src/*.js',
          '../src/**/*.js'
        ],
        options: {
          destination: '../doc'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('dev', ['concat', 'watch']);
  grunt.registerTask('build', ['concat', 'jshint', 'karma:build', 'uglify']);
  grunt.registerTask('build_and_watch', ['watch']);
  grunt.registerTask('doc', ['clean', 'jsdoc']);
};
