import { describe, it, expect } from 'vitest';
import * as ROSLIB from '../src/RosLib.js';

import { DOMParser, MIME_TYPE } from '@xmldom/xmldom';
// See https://developer.mozilla.org/docs/XPathResult#Constants
const XPATH_FIRST_ORDERED_NODE_TYPE = 9;

const sample_urdf = function () {
  return '<robot name="test_robot">' +
    '  <link name="link1">' + // test well-behaved versions of the basic shapes
    '    <visual>' +
    '      <geometry>' +
    '        <sphere radius="1" />' +
    '      </geometry>' +
    '    </visual>' +
    '  </link>' +
    '  <link name="link2">' +
    '    <visual>' +
    '      <geometry>' +
    '        <box size="0.5 0.5 0.5" />' +
    '      </geometry>' +
    '    </visual>' +
    '  </link>' +
    '  <link name="link3">' +
    '    <visual>' +
    '      <geometry>' +
    '        <cylinder radius="0.2" length="2" />' +
    '      </geometry>' +
    '    </visual>' +
    '  </link>' +
    '  <link name="link4">' + // and an extra one with a material
    '    <visual>' +
    '      <geometry>' +
    '        <box size="1 1 1" />' +
    '      </geometry>' +
    '      <material name="red">' +
    '        <color rgba="1 0 0 1" />' +
    '      </material>' +
    '    </visual>' +
    '  </link>' +
    '  <link name="link5">' + // link with referenced material and multiple visuals
    '    <visual>' +
    '      <geometry>' +
    '        <box size="1 1 1" />' +
    '      </geometry>' +
    '      <material name="blue" />' +
    '    </visual>' +
    '    <visual>' +
    '      <geometry>' +
    '        <box size="2 2 2" />' +
    '      </geometry>' +
    '      <material name="blue" />' +
    '    </visual>' +
    '  </link>' +
    '  <joint name="joint1" type="continuous">' +
    '    <parent link="link1"/>' +
    '    <child link="link2"/>' +
    '  </joint>' +
    '  <joint name="joint2" type="continuous">' +
    '    <parent link="link1"/>' +
    '    <child link="link3"/>' +
    '  </joint>' +
    '  <joint name="joint3" type="continuous">' +
    '    <parent link="link3"/>' +
    '    <child link="link4"/>' +
    '  </joint>' +
    '  <material name="blue">' +
    '    <color rgba="0 0 1 1" />' +
    '  </material>' +
    '</robot>';
};

function expectGeometryType(geometry: ROSLIB.UrdfGeometryLike | null | undefined, type: ROSLIB.UrdfType) {
  expect(geometry).toBeTruthy();
  switch (type) {
    case ROSLIB.UrdfType.SPHERE:
      expect(geometry!.type).to.equal(ROSLIB.UrdfType.SPHERE);
      expect(geometry).toBeInstanceOf(ROSLIB.UrdfSphere);
      break;
    case ROSLIB.UrdfType.BOX:
      expect(geometry!.type).to.equal(ROSLIB.UrdfType.BOX);
      expect(geometry).toBeInstanceOf(ROSLIB.UrdfBox);
      break;
    case ROSLIB.UrdfType.CYLINDER:
      expect(geometry!.type).to.equal(ROSLIB.UrdfType.CYLINDER);
      expect(geometry).toBeInstanceOf(ROSLIB.UrdfCylinder);
      break;
    case ROSLIB.UrdfType.MESH:
      expect(geometry!.type).to.equal(ROSLIB.UrdfType.MESH);
      expect(geometry).toBeInstanceOf(ROSLIB.UrdfMesh);
      break;
  }
}

function expectBoxGeometry(geometry: ROSLIB.UrdfBox, dimensions: ROSLIB.Vector3) {
  expect(geometry.dimension?.x).to.equal(dimensions.x);
  expect(geometry.dimension?.y).to.equal(dimensions.y);
  expect(geometry.dimension?.z).to.equal(dimensions.z);
}

function expectCylinderGeometry(geometry: ROSLIB.UrdfCylinder, length: number, radius: number) {
  expect(geometry.length).to.equal(length);
  expect(geometry.radius).to.equal(radius);
}

function expectMaterialWithColor(material: ROSLIB.UrdfMaterial | null | undefined, name: string, r: number, g: number, b: number, a: number) {
  expect(material).toBeTruthy();
  expect(material?.name).to.equal(name);
  expect(material?.color).toBeTruthy();
  expect(material?.color?.r).to.equal(r);
  expect(material?.color?.g).to.equal(g);
  expect(material?.color?.b).to.equal(b);
  expect(material?.color?.a).to.equal(a);
}

describe('URDF', function () {

  describe('parsing', function () {
    it('should load simple xml', function () {
      // http://wiki.ros.org/urdf/Tutorials/Create%20your%20own%20urdf%20file
      const urdfModel = new ROSLIB.UrdfModel({
        string: sample_urdf()
      });

      expect(urdfModel.name).to.equal('test_robot');
    });

    it('should correctly construct visual elements', function () {
      const urdfModel = new ROSLIB.UrdfModel({
        string: sample_urdf()
      });

      // Check types and values of visuals
      expect(urdfModel.links['link1'].visuals.length).to.equal(1);
      expectGeometryType(urdfModel.links['link1']?.visuals[0]?.geometry, ROSLIB.UrdfType.SPHERE);

      expect(urdfModel.links['link2'].visuals.length).to.equal(1);
      expectGeometryType(urdfModel.links['link2']?.visuals[0]?.geometry, ROSLIB.UrdfType.BOX);

      expect(urdfModel.links['link3'].visuals.length).to.equal(1);
      expectGeometryType(urdfModel.links['link3']?.visuals[0]?.geometry, ROSLIB.UrdfType.CYLINDER);

      expect(urdfModel.links['link4'].visuals.length).to.equal(1);
      expectGeometryType(urdfModel.links['link4']?.visuals[0]?.geometry, ROSLIB.UrdfType.BOX);

      expect(urdfModel.links['link5'].visuals.length).to.equal(2);
      expectGeometryType(urdfModel.links['link5']?.visuals[0]?.geometry, ROSLIB.UrdfType.BOX);
      expectGeometryType(urdfModel.links['link5']?.visuals[1]?.geometry, ROSLIB.UrdfType.BOX);

      // Check all the dimensions
      expect((urdfModel.links['link1']?.visuals[0]?.geometry as ROSLIB.UrdfSphere).radius).to.equal(1.0);
      expectBoxGeometry(
        (urdfModel.links['link2']?.visuals[0]?.geometry as ROSLIB.UrdfBox),
        new ROSLIB.Vector3({x: 0.5, y: 0.5, z: 0.5})
      );
      expectCylinderGeometry((urdfModel.links['link3']?.visuals[0]?.geometry as ROSLIB.UrdfCylinder), 2.0, 0.2);
      expectBoxGeometry(
        (urdfModel.links['link4']?.visuals[0]?.geometry as ROSLIB.UrdfBox),
        new ROSLIB.Vector3({x: 1.0, y: 1.0, z: 1.0})
      );
      expectBoxGeometry(
        (urdfModel.links['link5']?.visuals[0]?.geometry as ROSLIB.UrdfBox),
        new ROSLIB.Vector3({x: 1.0, y: 1.0, z: 1.0})
      );
      expectBoxGeometry(
        (urdfModel.links['link5']?.visuals[1]?.geometry as ROSLIB.UrdfBox),
        new ROSLIB.Vector3({x: 2.0, y: 2.0, z: 2.0})
      );

      expectMaterialWithColor(urdfModel.links['link4'].visuals[0].material, 'red', 1.0, 0, 0, 1.0);
      expectMaterialWithColor(urdfModel.links['link5'].visuals[0].material, 'blue', 0.0, 0.0, 1.0, 1.0);
    });

    it('is ignorant to the xml node', function () {
      const parser = new DOMParser();
      const xml = parser.parseFromString(sample_urdf(), MIME_TYPE.XML_TEXT);
      const robotXml = xml.documentElement;
      expect(robotXml.getAttribute('name')).to.equal('test_robot');
    });
  });

});
