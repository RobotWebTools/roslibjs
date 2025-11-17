import { describe, it, expect } from "vitest";
import { DOMParser } from "@xmldom/xmldom";
import UrdfJoint from "../src/urdf/UrdfJoint.ts";

describe("UrdfJoint", () => {
  it("should parse axis correctly from URDF", () => {
    const jointWithAxisUrdf = `
    <joint name="test_joint" type="revolute">
        <parent link="link1"/>
        <child link="link2"/>
        <axis xyz="0 1 0"/>
    </joint>`;
    const parser = new DOMParser();
    const xml = parser.parseFromString(
      jointWithAxisUrdf,
      "text/xml",
    ).documentElement;
    if (!xml) {
      throw new Error("Failed to parse XML");
    }
    const joint = new UrdfJoint({ xml });
    expect(joint.axis.x).toBe(0);
    expect(joint.axis.y).toBe(1);
    expect(joint.axis.z).toBe(0);
  });

  it("should default axis to (1,0,0) if not present", () => {
    const jointNoAxisUrdf = `
        <joint name="test_joint" type="revolute">
            <parent link="link1"/>
            <child link="link2"/>
        </joint>
        `;
    const parser = new DOMParser();
    const xml = parser.parseFromString(
      jointNoAxisUrdf,
      "text/xml",
    ).documentElement;
    if (!xml) {
      throw new Error("Failed to parse XML");
    }
    const joint = new UrdfJoint({ xml });
    expect(joint.axis.x).toBe(1);
    expect(joint.axis.y).toBe(0);
    expect(joint.axis.z).toBe(0);
  });

  it("should throw if axis xyz is malformed", () => {
    const jointMalformedAxisUrdf = `
        <joint name="test_joint" type="revolute">
            <parent link="link1"/>
            <child link="link2"/>
            <axis xyz="malformed data"/>
        </joint>
        `;
    const parser = new DOMParser();
    const xml = parser.parseFromString(
      jointMalformedAxisUrdf,
      "text/xml",
    ).documentElement;
    if (!xml) {
      throw new Error("Failed to parse XML");
    }
    expect(() => new UrdfJoint({ xml })).toThrowError(
      "If specified, axis must have an xyz value composed of three numbers",
    );
  });
});
