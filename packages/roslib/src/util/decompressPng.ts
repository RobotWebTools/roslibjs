/**
 * @fileOverview
 * @author Ramon Wijnands - rayman747@hotmail.com
 */

import type { DecodedPng } from "fast-png";

const textDecoder = new TextDecoder();

/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function decodes
 * the "image" as a Base64 string.
 *
 * @param data - An object containing the PNG data.
 */
export default async function decompressPng(data: string): Promise<unknown> {
  // fast-png is imported dynamically (lazily) rather than statically to avoid
  // a crash in environments such as React Native / Hermes. fast-png constructs
  // a `new TextDecoder('latin1')` at module load time, and Hermes does not
  // support the 'latin1' encoding, causing an immediate RangeError on import.
  // By deferring the import until a PNG message is actually received, users
  // who do not use PNG-compressed rosbridge messages are unaffected.
  // See: https://github.com/image-js/fast-png/blob/77a4479d68d84246793f58f7bbf2a2ea3a80c0f5/src/helpers/text.ts#L11
  const { decode } = await import("fast-png");
  const buffer = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));

  let decoded: DecodedPng;
  try {
    decoded = decode(buffer);
  } catch (error) {
    throw new Error("Error decoding PNG buffer", { cause: error });
  }

  try {
    return JSON.parse(textDecoder.decode(decoded.data));
  } catch (error) {
    throw new Error("Error parsing PNG JSON contents", { cause: error });
  }
}
