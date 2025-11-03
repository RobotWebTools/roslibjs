declare module 'cbor-js' {
  interface CBORDecoder {
    decode(data: ArrayBuffer, tagger?: unknown): unknown;
    encode(value: unknown): ArrayBuffer;
  }

  const CBOR: CBORDecoder;
  export default CBOR;
}
