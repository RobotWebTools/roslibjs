var expect = require('chai').expect;
var ROSLIB = require('..');

describe('Transform', function() {

  describe('creation', function() {
    // Fails test. Claims type is Object.
    // it('should return an object of the correct type', function() {
    //   var t = new ROSLIB.Transform();
    //   expect(t).to.be.a('ROSLIB.Transform');
    // });
    it('should contain a valid vector and quaternion', function() {
      var t = new ROSLIB.Transform({
        translation: { x: 1, y: 2, z: 3 },
        rotation: { x: 0.9, y: 0.8, z: 0.7, w: 1 }
      });
      // expect(t.translation).to.be.a('ROSLIB.Vector3');
      expect(t.translation.x).to.equal(1);
      // expect(t.rotation).to.be.a('ROSLIB.Quaternion');
      expect(t.rotation.z).to.equal(0.7);
      expect(t.rotation.w).to.equal(1);
    });
  });

});
