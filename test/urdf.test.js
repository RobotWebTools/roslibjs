var expect = require('chai').expect;
var ROSLIB = require('..');

var DOMParser = require('@xmldom/xmldom').DOMParser;
// See https://developer.mozilla.org/docs/XPathResult#Constants
var XPATH_FIRST_ORDERED_NODE_TYPE = 9;

var sample_urdf = function (){
  return '<robot name="test_robot">' +
    '  <link name="link1">'+ // test well-behaved versions of the basic shapes
    '    <visual>'+
    '      <geometry>'+
    '        <sphere radius="1" />'+
    '      </geometry>'+
    '    </visual>'+
    '  </link>'+
    '  <link name="link2">'+
    '    <visual>'+
    '      <geometry>'+
    '        <box size="0.5 0.5 0.5" />'+
    '      </geometry>'+
    '    </visual>'+
    '  </link>'+
    '  <link name="link3">'+
    '    <visual>'+
    '      <geometry>'+
    '        <cylinder radius="0.2" length="2" />'+
    '      </geometry>'+
    '    </visual>'+
    '  </link>'+
    '  <link name="link4">'+ // and an extra one with a material
    '    <visual>'+
    '      <geometry>'+
    '        <box size="1 1 1" />'+
    '      </geometry>'+
    '      <material name="red">'+
    '        <color rgba="1 0 0 1" />'+
    '      </material>'+
    '    </visual>'+
    '  </link>'+
    '  <link name="link5">'+ // link with referenced material and multiple visuals
    '    <visual>'+
    '      <geometry>'+
    '        <box size="1 1 1" />'+
    '      </geometry>'+
    '      <material name="blue" />'+
    '    </visual>'+
    '    <visual>'+
    '      <geometry>'+
    '        <box size="2 2 2" />'+
    '      </geometry>'+
    '      <material name="blue" />'+
    '    </visual>'+
    '  </link>'+
    '  <joint name="joint1" type="continuous">'+
    '    <parent link="link1"/>'+
    '    <child link="link2"/>'+
    '  </joint>'+
    '  <joint name="joint2" type="continuous">'+
    '    <parent link="link1"/>'+
    '    <child link="link3"/>'+
    '  </joint>'+
    '  <joint name="joint3" type="continuous">'+
    '    <parent link="link3"/>'+
    '    <child link="link4"/>'+
    '  </joint>'+
    '  <material name="blue">'+
    '    <color rgba="0 0 1 1" />'+
    '  </material>'+
    '</robot>';
}

describe('URDF', function() {

  describe('parsing', function() {
    it('should load simple xml', function() {
      // http://wiki.ros.org/urdf/Tutorials/Create%20your%20own%20urdf%20file
      var urdfModel = new ROSLIB.UrdfModel({
        string: sample_urdf()
      });

      expect(urdfModel.name).to.equal('test_robot');
    });

    it('should correctly construct visual elements', function() {
      var urdfModel = new ROSLIB.UrdfModel({
        string: sample_urdf()
      });

      // Check all the visual elements
      expect(urdfModel.links['link1'].visuals.length).to.equal(1);
      expect(urdfModel.links['link1'].visuals[0].geometry.radius).to.equal(1.0);
      expect(urdfModel.links['link2'].visuals[0].geometry.dimension.x).to.equal(0.5);
      expect(urdfModel.links['link2'].visuals[0].geometry.dimension.y).to.equal(0.5);
      expect(urdfModel.links['link2'].visuals[0].geometry.dimension.z).to.equal(0.5);
      expect(urdfModel.links['link3'].visuals[0].geometry.length).to.equal(2.0);
      expect(urdfModel.links['link3'].visuals[0].geometry.radius).to.equal(0.2);

      expect(urdfModel.links['link4'].visuals.length).to.equal(1);
      expect(urdfModel.links['link4'].visuals[0].material.name).to.equal('red');
      expect(urdfModel.links['link4'].visuals[0].material.color.r).to.equal(1.0);
      expect(urdfModel.links['link4'].visuals[0].material.color.g).to.equal(0);
      expect(urdfModel.links['link4'].visuals[0].material.color.b).to.equal(0);
      expect(urdfModel.links['link4'].visuals[0].material.color.a).to.equal(1.0);

      expect(urdfModel.links['link5'].visuals.length).to.equal(2);
      expect(urdfModel.links['link5'].visuals[0].material.name).to.equal('blue');
      expect(urdfModel.links['link5'].visuals[0].material.color.r).to.equal(0.0);
      expect(urdfModel.links['link5'].visuals[0].material.color.g).to.equal(0.0);
      expect(urdfModel.links['link5'].visuals[0].material.color.b).to.equal(1.0);
      expect(urdfModel.links['link5'].visuals[0].material.color.a).to.equal(1.0);
    });

    it('is ignorant to the xml node', function(){
      var parser = new DOMParser();
      var xml = parser.parseFromString(sample_urdf(), 'text/xml');
      var robotXml = xml.documentElement;
      expect(robotXml.getAttribute('name')).to.equal('test_robot');
    });
  });

});
