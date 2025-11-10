declare module "pngparse" {
  function parse(data: Buffer, cb: (err: string, data: unknown) => void);
}
