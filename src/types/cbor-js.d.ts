declare module "cbor-js" {
  function decode(
    data: ArrayBufferLike,
    tagger: (data: Uint8Array, tag: number) => unknown,
  ): unknown;
}
