type TypedArrayConstructor =
    | Uint8ArrayConstructor
    | Uint16ArrayConstructor
    | Uint32ArrayConstructor
    | Int8ArrayConstructor
    | Int16ArrayConstructor
    | Int32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor;

// Type for functions that convert arrays
type ArrayConverter = (bytes: Uint8Array) => number[];

const UPPER32 = Math.pow(2, 32);

let warnedPrecision = false;
function warnPrecision() {
  if (!warnedPrecision) {
    warnedPrecision = true;
    console.warn(
      'CBOR 64-bit integer array values may lose precision. No further warnings.'
    );
  }
}

/**
 * Unpack 64-bit unsigned integer from byte array.
 * @param {Uint8Array} bytes
 */
function decodeUint64LE(bytes: Uint8Array) {
  warnPrecision();

  const byteLen = bytes.byteLength;
  const offset = bytes.byteOffset;
  const arrLen = byteLen / 8;

  const buffer = bytes.buffer.slice(offset, offset + byteLen);
  const uint32View = new Uint32Array(buffer);

  const arr = new Array<number>(arrLen);
  for (let i = 0; i < arrLen; i++) {
    const si = i * 2;
    const lo = uint32View[si];
    const hi = uint32View[si + 1];
    arr[i] = lo + UPPER32 * hi;
  }

  return arr;
}

/**
 * Unpack 64-bit signed integer from byte array.
 * @param {Uint8Array} bytes
 */
function decodeInt64LE(bytes: Uint8Array) {
  warnPrecision();

  const byteLen = bytes.byteLength;
  const offset = bytes.byteOffset;
  const arrLen = byteLen / 8;

  const buffer = bytes.buffer.slice(offset, offset + byteLen);
  const uint32View = new Uint32Array(buffer);
  const int32View = new Int32Array(buffer);

  const arr = new Array<number>(arrLen);
  for (let i = 0; i < arrLen; i++) {
    const si = i * 2;
    const lo = uint32View[si];
    const hi = int32View[si + 1];
    arr[i] = lo + UPPER32 * hi;
  }

  return arr;
}

/**
 * Unpack typed array from byte array.
 * @param {Uint8Array} bytes
 * @param {ArrayConstructor} ArrayType - Desired output array type
 */
function decodeNativeArray<T extends TypedArrayConstructor>(bytes: Uint8Array, ArrayType: T): T['prototype'] {
  const byteLen = bytes.byteLength;
  const offset = bytes.byteOffset;
  const buffer = bytes.buffer.slice(offset, offset + byteLen);
  return new ArrayType(buffer);
}

/**
 * Supports a subset of draft CBOR typed array tags:
 *     <https://tools.ietf.org/html/draft-ietf-cbor-array-tags-00>
 *
 * Only supports little-endian tags for now.
 */
const nativeArrayTypes = {
  64: Uint8Array,
  69: Uint16Array,
  70: Uint32Array,
  72: Int8Array,
  77: Int16Array,
  78: Int32Array,
  85: Float32Array,
  86: Float64Array
} as const;

/**
 * We can also decode 64-bit integer arrays, since ROS has these types.
 */
const conversionArrayTypes: Record<number, ArrayConverter> = {
  71: decodeUint64LE,
  79: decodeInt64LE
} as const;

/**
 * Handle CBOR typed array tags during decoding.
 * @param {Uint8Array} data
 * @param tag
 */
export default function cborTypedArrayTagger(data: Uint8Array, tag: keyof typeof nativeArrayTypes) {
  if (tag in nativeArrayTypes) {
    const arrayType = nativeArrayTypes[tag];
    return decodeNativeArray(data, arrayType);
  }
  if (tag in conversionArrayTypes) {
    return conversionArrayTypes[tag](data);
  }
  return data;
}
