import { describe, it, expect } from 'vitest';
import * as ROSLIB from '../../src/RosLib.js';

describe('Param setting', function() {
  const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
  });
  const param = ros.Param({
    name: '/test/foo'
  });

  it('Param generics', function() {
    expect(param).to.be.instanceOf(ROSLIB.Param);
    expect(param.name).to.be.equal('/test/foo');
  });

  it('Param.set no callback', () => new Promise((done) =>  {
    param.set('foo');
    setTimeout(done, 500);
  }));

  it('Param.get', () => new Promise<void>((done) =>  {
    param.get(function(result) {
      expect(result).to.be.equal('foo');
      done();
    });
  }));

  it('Param.set w/ callback', () => new Promise<void>((done) =>  {
    param.set('bar', function() {
      done();
    });
  }));

  it('Param.get', () => new Promise<void>((done) =>  {
    param.get(function(result) {
      expect(result).to.be.equal('bar');
      done();
    });
  }));

  it('ros.getParams', () => new Promise<void>((done) =>  {
    ros.getParams(function(params) {
      expect(params).to.include(param.name);
      done();
    });
  }));

  it('Param.delete', () => new Promise<void>((done) =>  {
    param.delete(function() {
      ros.getParams(function(params) {
        expect(params).to.not.include(param.name);
        done();
      });
    });
  }));
});
