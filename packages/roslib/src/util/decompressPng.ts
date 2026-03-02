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
