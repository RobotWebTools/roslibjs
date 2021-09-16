// plugin that transpiles output into commonjs format
const commonjs = require('@rollup/plugin-commonjs');
// plugin that shows output file info
const filesize = require('rollup-plugin-filesize');
/// plugin that resolves node module imports
const {nodeResolve} = require('@rollup/plugin-node-resolve');
// plugin that minifies and obfuscates code
const {terser} = require('rollup-plugin-terser');
// plugin for importing JSON files (needed for socket.io source code that imports package.json)
const json = require('@rollup/plugin-json');

const input = 'src/RosLib.js';
const name = 'ROSLIB';

const outputFiles = {
  commonjsModule: './build/roslib.cjs.js',
  esModule: './build/roslib.esm.js',
  browserGlobal: './build/roslib.js',
  browserGlobalMinified: './build/roslib.min.js',
};

export default [
  // build main as CommonJS format for compatibility
  {
    input,
    output: {
      name,
      file: outputFiles.commonjsModule,
      format: 'cjs',
    },
    plugins: [nodeResolve({browser: true}), json(), commonjs(), filesize()],
  },
  // build module as ES5 in ES module format for modern tooling
  {
    input,
    output: {
      name,
      file: outputFiles.esModule,
      format: 'es',
    },
    plugins: [nodeResolve({browser: true}), json(), commonjs(), filesize()],
  },
  // build browser as IIFE module for script tag inclusion, unminified
  // Usage:
  // <script src="../build/ros3d.js"></script>
  {
    input,
    output: {
      name,
      file: outputFiles.browserGlobal,
      format: 'umd',
    },
    plugins: [nodeResolve({browser: true}), json(), commonjs(), filesize()],
  },
  // build browser as IIFE module for script tag inclusion, minified
  // Usage:
  // <script src="../build/ros3d.min.js"></script>
  {
    input,
    output: {
      name,
      file: outputFiles.browserGlobalMinified,
      format: 'umd',
    },
    plugins: [nodeResolve({browser: true}), json(), commonjs(), filesize(), terser()],
  },
];
