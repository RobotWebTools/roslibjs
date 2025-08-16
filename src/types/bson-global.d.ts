declare global {
  interface Window {
    bson?: () => { BSON: { deserialize(data: Uint8Array): unknown } };
  }

  const bson: undefined | (() => { BSON: { deserialize(data: Uint8Array): unknown } });
}
export {};
