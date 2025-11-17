/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 */

import Vector3, { type IVector3 } from "./Vector3.ts";
import Quaternion, { type IQuaternion } from "./Quaternion.ts";

export interface ITransform {
  /**
   * The ROSLIB.Vector3 describing the translation.
   */
  translation: IVector3;
  /**
   * The ROSLIB.Quaternion describing the rotation.
   */
  rotation: IQuaternion;
}

/**
 * A Transform in 3-space. Values are copied into this object.
 */
export default class Transform implements ITransform {
  translation: Vector3;
  rotation: Quaternion;

  constructor(options: ITransform) {
    // Copy the values into this object if they exist
    this.translation = new Vector3(options.translation);
    this.rotation = new Quaternion(options.rotation);
  }

  /**
   * Clone a copy of this transform.
   *
   * @returns The cloned transform.
   */
  clone(): Transform {
    return new Transform(this);
  }
}
