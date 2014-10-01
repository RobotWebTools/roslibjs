/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfMaterial = require('./UrdfMaterial');
var UrdfLink = require('./UrdfLink');
var DOMParser = require('../util/DOMParser');

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
  var that = this;
  var xml = options.xml;
  var string = options.string;
  this.materials = [];
  this.links = [];

  /**
   * Initialize the model with the given XML node.
   *
   * @param xml - the XML element to parse
   */
  var initXml = function(xmlDoc) {
    // Get the robot tag
    var robotXml = xmlDoc.evaluate('//robot', xmlDoc, null, XPATH_FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // Get the robot name
    that.name = robotXml.getAttribute('name');

    // Parse all the visual elements we need
    for (var n in robotXml.childNodes) {
      var node = robotXml.childNodes[n];
      if (node.tagName === 'material') {
        var material = new UrdfMaterial({
          xml : node
        });
        // Make sure this is unique
        if (that.materials[material.name]) {
          console.warn('Material ' + material.name + 'is not unique.');
        } else {
          that.materials[material.name] = material;
        }
      } else if (node.tagName === 'link') {
        var link = new UrdfLink({
          xml : node
        });
        // Make sure this is unique
        if (that.links[link.name]) {
          console.warn('Link ' + link.name + ' is not unique.');
        } else {
          // Check for a material
          if (link.visual && link.visual.material) {
            if (that.materials[link.visual.material.name]) {
              link.visual.material = that.materials[link.visual.material.name];
            } else if (link.visual.material) {
              that.materials[link.visual.material.name] = link.visual.material;
            }
          }

          // Add the link
          that.links[link.name] = link;
        }
      }
    }
  };

  // Check if we are using a string or an XML element
  if (string) {
    // Parse the string
    var parser = new DOMParser();
    xml = parser.parseFromString(string, 'text/xml');
  }
  // Pass it to the XML parser
  initXml(xml);
}

module.exports = UrdfModel;