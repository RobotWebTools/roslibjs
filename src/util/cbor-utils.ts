import { decode, DecodeOptions } from 'cbor2';

let warnedPrecision = false;
function warnPrecision() {
  if (!warnedPrecision) {
    warnedPrecision = true;
    console.warn(
      'CBOR 64-bit integer array values may lose precision. No further warnings.'
    );
  }
}

function isBigIntTypedArray(obj: unknown): obj is BigUint64Array | BigInt64Array {
  return obj instanceof BigUint64Array || obj instanceof BigInt64Array;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function cborDecode<T = unknown>(data: string | ArrayBuffer | ArrayBufferView, decodeOptions?: DecodeOptions): T {
  let binary: Uint8Array | string;
  if (ArrayBuffer.isView(data)) {
    const view = data;
    binary = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  } else if (data instanceof ArrayBuffer) {
    binary = new Uint8Array(data);
  } else {
    binary = data;
  }

  return decode<T>(binary, decodeOptions);
}

/**
 * Decode a CBOR-encoded buffer, expecting a number array in return.
 *
 * This function is a hack to maintain compatibility with existing behavior.
 * `cbor2` will return a BigInt64Array or BigUint64Array if decoded properly,
 * but existing tests expect that the `bigint` will be truncated and returned as an array of numbers.
 *
 * FIXME: Determine if this behavior is still needed
 *
 * @param data
 */
export function cborDecodeTruncate(data: string | ArrayBuffer | ArrayBufferView): unknown {
  const decoded = cborDecode(data);

  if (isBigIntTypedArray(decoded)) {
    // Convert bigints to numbers (with potential precision loss)
    warnPrecision();
    return Array.from(decoded, (bigintVal) => Number(bigintVal));
  }

  return decoded;
}
