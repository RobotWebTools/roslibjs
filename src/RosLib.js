/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */
export * from './core';
export * from './actionlib';
export * from './math';
export * from './tf';
export * from './urdf';

/**
 * If you use roslib in a browser, all the classes will be exported to a global variable called ROSLIB.
 *
 * If you use nodejs, this is the variable you get when you require('roslib').
 */
// @ts-expect-error -- global browser-only shenanigans
var ROSLIB = this.ROSLIB || {
  /**
   * @default
   * @description Library version
   */
  REVISION: '1.3.0'
};

var assign = require('object-assign');

// Add core components
assign(ROSLIB, require('./core'));

assign(ROSLIB, require('./math'));

assign(ROSLIB, require('./tf'));

assign(ROSLIB, require('./urdf'));
