declare module "cbor-js" {
  function encode(data: unknown): ArrayBuffer;

  function decode(
    data: ArrayBufferLike,
    tagger: (data: Uint8Array<ArrayBuffer>, tag: number) => unknown,
  ): unknown;
}
