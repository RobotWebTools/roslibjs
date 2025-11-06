/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/** @description Library version */
export * from "./index.js";
import ROSLIB from "./index.js";

// same as index.js, except add to global namespace for in-browser support (i.e. CDN)
globalThis.ROSLIB = ROSLIB;
