var expect = require('chai').expect;
var ROSLIB = require('../..');

describe('Param setting', function() {
    var ros = new ROSLIB.Ros({
        url: 'ws://localhost:9090'
    });
    var param = ros.Param({
        name: '/test/foo'
    });

    it('Param generics', function() {
        expect(param).to.be.instanceOf(ROSLIB.Param);
        expect(param.name).to.be.equal('/test/foo');
    });

    it('Param.set no callback', function(done) {
        param.set('foo');
        setTimeout(done, 500);
    });

    it('Param.get', function(done) {
        param.get(function(result) {
            expect(result).to.be.equal('foo');
            done();
        });
    });

    it('Param.set w/ callback', function(done) {
        param.set('bar', function() {
            done();
        });
    });

    it('Param.get', function(done) {
        param.get(function(result) {
            expect(result).to.be.equal('bar');
            done();
        });
    });

    it('ros.getParams', function(done) {
        ros.getParams(function(params) {
            expect(params).to.include(param.name);
            done();
        });
    });

  // TODO: Disable delete param test due to the bug in rosapi. Please put it back after
  // merging #284 in rosbridge_suite
  /*
    it('Param.delete', function(done) {
        param.delete(function() {
            ros.getParams(function(params) {
                expect(params).to.not.include(param.name);
                done();
            });
        });
    });
    */
});
