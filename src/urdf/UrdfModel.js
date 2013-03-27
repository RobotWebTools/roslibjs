/**
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A URDF Model can be used to parse a given URDF into the appropriate elements. 
 * 
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 *  * string - the XML element to parse as a string
 */
ROSLIB.UrdfModel = function(options) {
  var that = this;
  var options = options || {};
  var xml = options.xml;
  var string = options.string;

  this.name;
  this.materials = [];
  this.links = [];

  /**
   * Initialize the model with the given XML node.
   * 
   * @param xml - the XML element to parse
   */
  var initXml = function(xml) {
    // get the robot tag
    var robotXml = xml.evaluate('//robot', xml, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // get the robot name
    that.name = robotXml.getAttribute('name');

    // parse all the visual elements we need
    for (n in robotXml.childNodes) {
      var node = robotXml.childNodes[n];
      if (node.tagName === 'material') {
        var material = new ROSLIB.UrdfMaterial({
          xml : node
        });
        // make sure this is unique
        if (that.materials[material.name]) {
          console.warn('Material ' + material.name + 'is not unique.');
        } else {
          that.materials[material.name] = material;
        }
      } else if (node.tagName === 'link') {
        var link = new ROSLIB.UrdfLink({
          xml : node
        });
        // make sure this is unique
        if (that.links[link.name]) {
          console.warn('Link ' + link.name + ' is not unique.');
        } else {
          // check for a material
          if (link.visual && link.visual.material) {
            if (that.materials[link.visual.material.name]) {
              link.visual.material = that.materials[link.visual.material.name];
            } else if (link.visual.material) {
              that.materials[link.visual.material.name] = link.visual.material;
            }
          }

          // add the link
          that.links[link.name] = link;
        }
      }
    }
  };

  // check if we are using a string or an XML element
  if (string) {
    // parse the string
    var parser = new DOMParser();
    xml = parser.parseFromString(string, 'text/xml');
  }
  // pass it to the XML parser
  initXml(xml);
};
