declare module "cbor-js" {
  function decode(
    data: ArrayBufferLike,
    tagger: (data: Uint8Array<ArrayBuffer>, tag: number) => unknown,
  ): unknown;
}
