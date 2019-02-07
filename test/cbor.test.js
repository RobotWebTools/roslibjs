var expect = require('chai').expect;
var CBOR = require('cbor-js');
var cborTypedArrayTagger = require('../src/util/cborTypedArrayTags.js');

/** Convert hex string to ArrayBuffer. */
function hexToBuffer(hex) {
  var tokens = hex.match(/[0-9a-fA-F]{2}/gi);
  var arr = tokens.map(function(t) {
    return parseInt(t, 16);
  });
  return new Uint8Array(arr).buffer;
}


describe('CBOR Typed Array Tagger', function() {

  it('should convert tagged Uint16Array', function() {
    var data = hexToBuffer('d84546010002000300');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Uint16Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(2);
    expect(msg[2]).to.equal(3);
  });

  it('should convert tagged Uint32Array', function() {
    var data = hexToBuffer('d8464c010000000200000003000000');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Uint32Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(2);
    expect(msg[2]).to.equal(3);
  });

  it('should convert tagged Uint64Array', function() {
    var data = hexToBuffer('d8475818010000000000000002000000000000000300000000000000');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(2);
    expect(msg[2]).to.equal(3);
  });

  it('should convert tagged Int8Array', function() {
    var data = hexToBuffer('d8484301fe03');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Int8Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(-2);
    expect(msg[2]).to.equal(3);
  });

  it('should convert tagged Int16Array', function() {
    var data = hexToBuffer('d84d460100feff0300');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Int16Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(-2);
    expect(msg[2]).to.equal(3);
  });

  it('should convert tagged Int32Array', function() {
    var data = hexToBuffer('d84e4c01000000feffffff03000000');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Int32Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(-2);
    expect(msg[2]).to.equal(3);
  });

  it('should convert tagged Int64Array', function() {
    var data = hexToBuffer('d84f58180100000000000000feffffffffffffff0300000000000000');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(-2);
    expect(msg[2]).to.equal(3);
  });

  it('should convert tagged Float32Array', function() {
    var data = hexToBuffer('d8554ccdcc8c3fcdcc0cc033335340');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Float32Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.be.closeTo(1.1, 1e-5);
    expect(msg[1]).to.be.closeTo(-2.2, 1e-5);
    expect(msg[2]).to.be.closeTo(3.3, 1e-5);
  });

  it('should convert tagged Float64Array', function() {
    var data = hexToBuffer('d85658189a9999999999f13f9a999999999901c06666666666660a40');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Float64Array');
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.be.closeTo(1.1, 1e-5);
    expect(msg[1]).to.be.closeTo(-2.2, 1e-5);
    expect(msg[2]).to.be.closeTo(3.3, 1e-5);
  });

  it('should be able to unpack two typed arrays', function() {
    var data = hexToBuffer('82d8484308fe05d84d460100feff0300');
    var msg = CBOR.decode(data, cborTypedArrayTagger);

    expect(msg).to.be.a('Array');
    expect(msg).to.have.lengthOf(2);
    expect(msg[0][0]).to.equal(8);
    expect(msg[0][1]).to.equal(-2);
    expect(msg[0][2]).to.equal(5);
    expect(msg[1][0]).to.equal(1);
    expect(msg[1][1]).to.equal(-2);
    expect(msg[1][2]).to.equal(3);
  });
});
