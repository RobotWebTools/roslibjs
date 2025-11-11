/********** Utility Methods for parsing Joint **********/
import type { Element, Node } from "@xmldom/xmldom";
import Pose from "../math/Pose.js";
import Quaternion from "../math/Quaternion.js";
import Vector3 from "../math/Vector3.js";
import { UrdfAttrs } from "./UrdfTypes.js";

export function parseUrdfOrigin(originElement: Element): Pose {
  // Check the XYZ
  const xyz: string[] | undefined = originElement
    .getAttribute(UrdfAttrs.Xyz)
    ?.split(" ");
  let position: Vector3 = new Vector3();
  if (xyz?.length === 3) {
    position = new Vector3({
      x: parseFloat(xyz[0]),
      y: parseFloat(xyz[1]),
      z: parseFloat(xyz[2]),
    });
  }

  // Check the RPY
  const rpy = originElement.getAttribute(UrdfAttrs.Rpy)?.split(" ");
  let orientation = new Quaternion();
  if (rpy?.length === 3) {
    // Convert from RPY
    const roll = parseFloat(rpy[0]);
    const pitch = parseFloat(rpy[1]);
    const yaw = parseFloat(rpy[2]);
    const phi = roll / 2.0;
    const the = pitch / 2.0;
    const psi = yaw / 2.0;
    const x =
      Math.sin(phi) * Math.cos(the) * Math.cos(psi) -
      Math.cos(phi) * Math.sin(the) * Math.sin(psi);
    const y =
      Math.cos(phi) * Math.sin(the) * Math.cos(psi) +
      Math.sin(phi) * Math.cos(the) * Math.sin(psi);
    const z =
      Math.cos(phi) * Math.cos(the) * Math.sin(psi) -
      Math.sin(phi) * Math.sin(the) * Math.cos(psi);
    const w =
      Math.cos(phi) * Math.cos(the) * Math.cos(psi) +
      Math.sin(phi) * Math.sin(the) * Math.sin(psi);

    orientation = new Quaternion({
      x: x,
      y: y,
      z: z,
      w: w,
    });
    orientation.normalize();
  }

  return new Pose({
    position: position,
    orientation: orientation,
  });
}

export function isElement(node: Node): node is Element {
  // Node.ELEMENT_TYPE = 1
  return node.nodeType === 1;
}
