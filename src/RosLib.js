/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */
import eventemitter2 from 'eventemitter2';

export const REVISION = '1.1.0';
export const {EventEmitter2} = eventemitter2;

export * from './core/index.js';
export * from './actionlib/index.js';
export * from './math/index.js';
export * from './tf/index.js';
export * from './urdf/index.js';
