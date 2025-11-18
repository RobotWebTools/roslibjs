import { describe, it, expect } from "vitest";
import { decode } from "cbor2";

/** Convert hex string to ArrayBuffer. */
function hexToBuffer(hex: string) {
  const tokens = hex.match(/[0-9a-fA-F]{2}/gi);
  if (!tokens) {
    throw new Error("No tokens matched!");
  }
  const arr = tokens.map(function (t) {
    return parseInt(t, 16);
  });
  return new Uint8Array(arr);
}

describe("CBOR Typed Array Tagger", function () {
  it("should convert tagged Uint16Array", function () {
    const data = hexToBuffer("d84546010002000300");
    const msg = decode(data);

    if (!(msg instanceof Uint16Array)) {
      throw new Error("Expected Uint16Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(2);
    expect(msg[2]).to.equal(3);
  });

  it("should convert tagged Uint32Array", function () {
    const data = hexToBuffer("d8464c010000000200000003000000");
    const msg = decode(data);

    if (!(msg instanceof Uint32Array)) {
      throw new Error("Expected Uint32Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(2);
    expect(msg[2]).to.equal(3);
  });

  it("should convert tagged BigUint64Array", function () {
    const data = hexToBuffer(
      "d8475818010000000000000002000000000000000300000000000000",
    );
    const msg = decode(data);

    if (!(msg instanceof BigUint64Array)) {
      throw new Error("Expected BigUint64Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(BigInt(1));
    expect(msg[1]).to.equal(BigInt(2));
    expect(msg[2]).to.equal(BigInt(3));
  });

  it("should convert tagged Int8Array", function () {
    const data = hexToBuffer("d8484301fe03");
    const msg = decode(data);

    if (!(msg instanceof Int8Array)) {
      throw new Error("Expected Int8Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(-2);
    expect(msg[2]).to.equal(3);
  });

  it("should convert tagged Int16Array", function () {
    const data = hexToBuffer("d84d460100feff0300");
    const msg = decode(data);

    if (!(msg instanceof Int16Array)) {
      throw new Error("Expected Int16Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(-2);
    expect(msg[2]).to.equal(3);
  });

  it("should convert tagged Int32Array", function () {
    const data = hexToBuffer("d84e4c01000000feffffff03000000");
    const msg = decode(data);

    if (!(msg instanceof Int32Array)) {
      throw new Error("Expected Int32Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(1);
    expect(msg[1]).to.equal(-2);
    expect(msg[2]).to.equal(3);
  });

  it("should convert tagged BigInt64Array", function () {
    const data = hexToBuffer(
      "d84f58180100000000000000feffffffffffffff0300000000000000",
    );
    const msg = decode(data);

    if (!(msg instanceof BigInt64Array)) {
      throw new Error("Expected BigInt64Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.equal(BigInt(1));
    expect(msg[1]).to.equal(BigInt(-2));
    expect(msg[2]).to.equal(BigInt(3));
  });

  it("should convert tagged Float32Array", function () {
    const data = hexToBuffer("d8554ccdcc8c3fcdcc0cc033335340");
    const msg = decode(data);

    if (!(msg instanceof Float32Array)) {
      throw new Error("Expected Float32Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.be.closeTo(1.1, 1e-5);
    expect(msg[1]).to.be.closeTo(-2.2, 1e-5);
    expect(msg[2]).to.be.closeTo(3.3, 1e-5);
  });

  it("should convert tagged Float64Array", function () {
    const data = hexToBuffer(
      "d85658189a9999999999f13f9a999999999901c06666666666660a40",
    );
    const msg = decode(data);

    if (!(msg instanceof Float64Array)) {
      throw new Error("Expected Float64Array");
    }
    expect(msg).to.have.lengthOf(3);
    expect(msg[0]).to.be.closeTo(1.1, 1e-5);
    expect(msg[1]).to.be.closeTo(-2.2, 1e-5);
    expect(msg[2]).to.be.closeTo(3.3, 1e-5);
  });

  it("should be able to unpack two typed arrays", function () {
    const data = hexToBuffer("82d8484308fe05d84d460100feff0300");
    const msg = decode(data);

    if (!Array.isArray(msg)) {
      throw new Error("Expected Array");
    }
    if (!(msg[0] instanceof Int8Array)) {
      throw new Error("Expected Int8Array");
    }
    if (!(msg[1] instanceof Int16Array)) {
      throw new Error("Expected Int16Array");
    }
    expect(msg).to.have.lengthOf(2);
    expect(msg[0][0]).to.equal(8);
    expect(msg[0][1]).to.equal(-2);
    expect(msg[0][2]).to.equal(5);
    expect(msg[1][0]).to.equal(1);
    expect(msg[1][1]).to.equal(-2);
    expect(msg[1][2]).to.equal(3);
  });
});
