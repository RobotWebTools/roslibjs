declare module 'pngparse' {
  interface ParsedImage {
    width: number;
    height: number;
    channels: number;
    data: Buffer;
  }

  type ParseOptions = Record<string, unknown>;

  function parse(
    buffer: Buffer,
    callback: (err: Error | null, data?: ParsedImage) => void,
  ): void;
  function parse(
    buffer: Buffer,
    options: ParseOptions,
    callback: (err: Error | null, data?: ParsedImage) => void,
  ): void;

  export = { parse };
}
