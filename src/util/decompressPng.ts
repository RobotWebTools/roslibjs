/**
 * @fileOverview
 * @author Ramon Wijnands - rayman747@hotmail.com
 */

import pngparse from "pngparse";

/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function decodes
 * the "image" as a Base64 string.
 *
 * @param data - An object containing the PNG data.
 * @param callback - Function with the following params:
 */
export default function decompressPng(
  data: string,
  callback: (data: unknown) => void,
) {
  const buffer = new Buffer(data, "base64");

  pngparse.parse(buffer, function (err, data) {
    if (err || !(data instanceof Object) || !("data" in data)) {
      throw new Error("Cannot process PNG encoded message ");
    } else {
      const jsonData = String(data.data);
      callback(JSON.parse(jsonData));
    }
  });
}
