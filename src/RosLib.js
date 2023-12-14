/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * If you use roslib in a browser, all the classes will be exported to a global variable called ROSLIB.
 *
 * If you use nodejs, this is the variable you get when you require('roslib').
 */
var ROSLIB = {
  /**
   * @default
   * @description Library version
   */
  REVISION: '1.4.1',
  ...require('./core'),
  ...require('./actionlib'),
  ...require('./math'),
  ...require('./tf'),
  ...require('./urdf')
};

module.exports = ROSLIB;
