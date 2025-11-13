/**
 * @fileOverview
 * @author Ramon Wijnands - rayman747@hotmail.com
 */

import { decode } from "fast-png";
import { Buffer } from "buffer";

const textDecoder = new TextDecoder();

/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function decodes
 * the "image" as a Base64 string.
 *
 * @param data - An object containing the PNG data.
 */
export default function decompressPng(data: string): unknown {
  const buffer = Buffer.from(data, "base64");

  const decoded = tryDecodeBuffer(buffer);

  try {
    return JSON.parse(textDecoder.decode(decoded.data));
  } catch (error) {
    throw new Error("Error parsing PNG JSON contents", { cause: error });
  }
}

function tryDecodeBuffer(buffer: Buffer) {
  try {
    return decode(buffer);
  } catch (error) {
    throw new Error("Error decoding buffer", { cause: error });
  }
}
