'use strict';

var UPPER32 = Math.pow(2, 32);

var warnedPrecision = false;
function warnPrecision() {
  if (!warnedPrecision) {
    warnedPrecision = true;
    console.warn('CBOR 64-bit integer array values may lose precision. No further warnings.');
  }
}

/**
 * Unpacks 64-bit unsigned integer from byte array.
 * @param {Uint8Array} bytes
*/
function decodeUint64LE(bytes) {
  warnPrecision();

  var byteLen = bytes.byteLength;
  var arrLen = byteLen / 8;

  var buffer = bytes.buffer.slice(-byteLen);
  var uint32View = new Uint32Array(buffer);

  var arr = new Array(arrLen);
  for (var i = 0; i < arrLen; i++) {
    var si = i * 2;
    var lo = uint32View[si];
    var hi = uint32View[si+1];
    arr[i] = lo + UPPER32 * hi;
  }

  return arr;
}

/**
 * Unpacks 64-bit signed integer from byte array.
 * @param {Uint8Array} bytes
*/
function decodeInt64LE(bytes) {
  warnPrecision();

  var byteLen = bytes.byteLength;
  var arrLen = byteLen / 8;

  var buffer = bytes.buffer.slice(-byteLen);
  var uint32View = new Uint32Array(buffer);
  var int32View = new Int32Array(buffer);

  var arr = new Array(arrLen);
  for (var i = 0; i < arrLen; i++) {
    var si = i * 2;
    var lo = uint32View[si];
    var hi = int32View[si+1];
    arr[i] = lo + UPPER32 * hi;
  }

  return arr;
}

/**
 * Unpacks typed array from byte array.
 * @param {Uint8Array} bytes
 * @param {type} ArrayType - desired output array type
*/
function decodeNativeArray(bytes, ArrayType) {
  var byteLen = bytes.byteLength;
  var buffer = bytes.buffer.slice(-byteLen);
  return new ArrayType(buffer);
}

/**
 * Support a subset of draft CBOR typed array tags:
 *   <https://tools.ietf.org/html/draft-ietf-cbor-array-tags-00>
 * Only support little-endian tags for now.
 */
var nativeArrayTypes = {
  64: Uint8Array,
  69: Uint16Array,
  70: Uint32Array,
  72: Int8Array,
  77: Int16Array,
  78: Int32Array,
  85: Float32Array,
  86: Float64Array
};

/**
 * We can also decode 64-bit integer arrays, since ROS has these types.
 */
var conversionArrayTypes = {
  71: decodeUint64LE,
  79: decodeInt64LE
};

/**
 * Handles CBOR typed array tags during decoding.
 * @param {Uint8Array} data
 * @param {Number} tag
 */
function cborTypedArrayTagger(data, tag) {
  if (tag in nativeArrayTypes) {
    var arrayType = nativeArrayTypes[tag];
    return decodeNativeArray(data, arrayType);
  }
  if (tag in conversionArrayTypes) {
    return conversionArrayTypes[tag](data);
  }
  return data;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = cborTypedArrayTagger;
}
