module.exports = function(grunt) {

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    shell: {
      ts: {
        command: 'tsc -p .'
      }
    },
    browserify: {
      dist: {
        src: ['./tsbuild/RosLib.js'],
        dest: './build/roslib.js',
        options: {
          plugin: ['esmify'],
          ignore: ['ws']
        }
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
        files: ['./src/**/*.js'],
        tasks: ['browserify']
      },
      build_and_watch: {
        options: {
          interrupt: true
        },
        files: ['Gruntfile.js', 'eslint.config.js', './src/**/*.js'],
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
        src: ['./src/*.js', './src/**/*.js'],
        options: {
          destination: './doc',
          configure: 'jsdoc_conf.json'
        }
      }
    }
  });

  grunt.registerTask('dev', ['browserify', 'watch']);
  grunt.registerTask('build', ['shell:ts', 'browserify', 'uglify']);
  grunt.registerTask('build_and_watch', ['watch']);
  grunt.registerTask('doc', ['clean', 'jsdoc']);
};
