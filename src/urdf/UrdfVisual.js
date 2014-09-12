/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var Pose = require('../math/Pose');
var Vector3 = require('../math/Vector3');
var Quaternion = require('../math/Quaternion');

var UrdfCylinder = require('./UrdfCylinder');
var UrdfBox = require('./UrdfBox');
var UrdfMaterial = require('./UrdfMaterial');
var UrdfMesh = require('./UrdfMesh');
var UrdfSphere = require('./UrdfSphere');

/**
 * A Visual element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfVisual(options) {
  options = options || {};
  var that = this;
  var xml = options.xml;
  this.origin = null;
  this.geometry = null;
  this.material = null;

  /**
   * Initialize the element with the given XML node.
   *
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    // Origin
    var origins = xml.getElementsByTagName('origin');
    if (origins.length === 0) {
      // use the identity as the default
      that.origin = new Pose();
    } else {
      // Check the XYZ
      var xyz = origins[0].getAttribute('xyz');
      var position = new Vector3();
      if (xyz) {
        xyz = xyz.split(' ');
        position = new Vector3({
          x : parseFloat(xyz[0]),
          y : parseFloat(xyz[1]),
          z : parseFloat(xyz[2])
        });
      }

      // Check the RPY
      var rpy = origins[0].getAttribute('rpy');
      var orientation = new Quaternion();
      if (rpy) {
        rpy = rpy.split(' ');
        // Convert from RPY
        var roll = parseFloat(rpy[0]);
        var pitch = parseFloat(rpy[1]);
        var yaw = parseFloat(rpy[2]);
        var phi = roll / 2.0;
        var the = pitch / 2.0;
        var psi = yaw / 2.0;
        var x = Math.sin(phi) * Math.cos(the) * Math.cos(psi) - Math.cos(phi) * Math.sin(the)
            * Math.sin(psi);
        var y = Math.cos(phi) * Math.sin(the) * Math.cos(psi) + Math.sin(phi) * Math.cos(the)
            * Math.sin(psi);
        var z = Math.cos(phi) * Math.cos(the) * Math.sin(psi) - Math.sin(phi) * Math.sin(the)
            * Math.cos(psi);
        var w = Math.cos(phi) * Math.cos(the) * Math.cos(psi) + Math.sin(phi) * Math.sin(the)
            * Math.sin(psi);

        orientation = new Quaternion({
          x : x,
          y : y,
          z : z,
          w : w
        });
        orientation.normalize();
      }
      that.origin = new Pose({
        position : position,
        orientation : orientation
      });
    }

    // Geometry
    var geoms = xml.getElementsByTagName('geometry');
    if (geoms.length > 0) {
      var shape = null;
      // Check for the shape
      for (var n in geoms[0].childNodes) {
        var node = geoms[0].childNodes[n];
        if (node.nodeType === 1) {
          shape = node;
          break;
        }
      }
      // Check the type
      var type = shape.nodeName;
      if (type === 'sphere') {
        that.geometry = new UrdfSphere({
          xml : shape
        });
      } else if (type === 'box') {
        that.geometry = new UrdfBox({
          xml : shape
        });
      } else if (type === 'cylinder') {
        that.geometry = new UrdfCylinder({
          xml : shape
        });
      } else if (type === 'mesh') {
        that.geometry = new UrdfMesh({
          xml : shape
        });
      } else {
        console.warn('Unknown geometry type ' + type);
      }
    }

    // Material
    var materials = xml.getElementsByTagName('material');
    if (materials.length > 0) {
      that.material = new UrdfMaterial({
        xml : materials[0]
      });
    }
  };

  // Pass it to the XML parser
  initXml(xml);
}

module.exports = UrdfVisual;