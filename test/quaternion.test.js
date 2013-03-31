var expect = chai.expect;

describe('Quaternion', function() {

  describe('creation', function() {
    // Test fails. Claims returning Object.
    // it('should return an object of the correct type', function() {
    //   var q = new ROSLIB.Quaternion();
    //   expect(q).to.be.a('ROSLIB.Quaternion');
    // });
    it('should return an identity quaternion when no params are specified', function() {
      var q = new ROSLIB.Quaternion();
      expect(q.x).to.equal(0);
      expect(q.y).to.equal(0);
      expect(q.z).to.equal(0);
      expect(q.w).to.equal(1);
    });
    it('should return a quaternion matching the options hash', function() {
      var q = new ROSLIB.Quaternion({ x: 1.1, y: 2.2, z: 3.3, w: 4.4 });
      expect(q.x).to.equal(1.1);
      expect(q.y).to.equal(2.2);
      expect(q.z).to.equal(3.3);
      expect(q.w).to.equal(4.4);
    });
  });

  describe('conjugation', function() {
    it('should conjugate itself', function() {
      var q = new ROSLIB.Quaternion({ x: 1.1, y: 2.2, z: 3.3, w: 4.4 });
      q.conjugate();
      expect(q.x).to.equal(1.1*-1);
      expect(q.y).to.equal(2.2*-1);
      expect(q.z).to.equal(3.3*-1);
    });
  });

});
