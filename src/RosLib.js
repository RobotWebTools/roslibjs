/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/** @description Library version */
export const REVISION = '1.4.1';
export * from './core/index.js';
export * from './actionlib/index.js';
export * from './math/index.js';
export * from './tf/index.js';
export * from './urdf/index.js';

import * as Core from './core/index.js';
import * as ActionLib from './actionlib/index.js';
import * as Math from './math/index.js';
import * as Tf from './tf/index.js';
import * as Urdf from './urdf/index.js';

// Add to global namespace for in-browser support (i.e. CDN)
globalThis.ROSLIB = {
  REVISION,
  ...Core,
  ...ActionLib,
  ...Math,
  ...Tf,
  ...Urdf
};
