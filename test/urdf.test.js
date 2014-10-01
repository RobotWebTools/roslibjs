var expect = require('chai').expect;
var ROSLIB = require('..');

var DOMParser = typeof DOMParser == 'function' ? DOMParser : require('../src/util/DOMParser');
// See https://developer.mozilla.org/docs/XPathResult#Constants
var XPATH_FIRST_ORDERED_NODE_TYPE = 9;

var sample_urdf = function (){
  return '<robot name="test_robot">' +
    '  <link name="link1" />'+
    '  <link name="link2" />'+
    '  <link name="link3" />'+
    '  <link name="link4" />'+
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

    it('is ignorant to the xml node', function(){
      var parser = new DOMParser();
      var xml = parser.parseFromString(sample_urdf(), 'text/xml');
      var robotXml = xml.evaluate('//robot', xml, null, XPATH_FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      expect(robotXml.getAttribute('name')).to.equal('test_robot');
    });
  });

});
