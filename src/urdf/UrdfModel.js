/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfMaterial = require('./UrdfMaterial');
var UrdfLink = require('./UrdfLink');
var UrdfJoint = require('./UrdfJoint');
var DOMParser = require('xmldom').DOMParser;

// See https://developer.mozilla.org/docs/XPathResult#Constants
var XPATH_FIRST_ORDERED_NODE_TYPE = 9;

/**
 * A URDF Model can be used to parse a given URDF into the appropriate elements.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 *  * string - the XML element to parse as a string
 */
function UrdfModel(options) {
  options = options || {};
  var xmlDoc = options.xml;
  var string = options.string;
  this.materials = {};
  this.links = {};
  this.joints = {};

  // Check if we are using a string or an XML element
  if (string) {
    // Parse the string
    var parser = new DOMParser();
    xmlDoc = parser.parseFromString(string, 'text/xml');
  }

  // Initialize the model with the given XML node.
  // Get the robot tag
  var robotXml = xmlDoc.documentElement;

  // Get the robot name
  this.name = robotXml.getAttribute('name');

  // Parse all the visual elements we need
  for (var nodes = robotXml.childNodes, i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.tagName === 'material') {
      var material = new UrdfMaterial({
        xml : node
      });
      // Make sure this is unique
      if (this.materials[material.name] !== void 0) {
        if( this.materials[material.name].isLink() ) {
          this.materials[material.name].assign( material );
        } else {
          console.warn('Material ' + material.name + 'is not unique.');
        }
      } else {
        this.materials[material.name] = material;
      }
    } else if (node.tagName === 'link') {
      var link = new UrdfLink({
        xml : node
      });
      // Make sure this is unique
      if (this.links[link.name] !== void 0) {
        console.warn('Link ' + link.name + ' is not unique.');
      } else {
        // Check for a material
        for( var j=0; j<link.visuals.length; j++ )
        {
          var mat = link.visuals[j].material; 
          if ( mat !== null ) {
            if (this.materials[mat.name] !== void 0) {
              link.visuals[j].material = this.materials[mat.name];
            } else {
              this.materials[mat.name] = mat;
            }
          }
        }

        // Add the link
        this.links[link.name] = link;
      }
    } else if (node.tagName === 'joint') {
      var joint = new UrdfJoint({
        xml : node
      });
      this.joints[joint.name] = joint;
    }
  }
}

module.exports = UrdfModel;
