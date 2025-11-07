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
 * @private
 * @param data - An object containing the PNG data.
 * @param callback - Function with the following params:
 */
export default function decompressPng(
  data: string,
  callback: (data: unknown) => void,
) {
  const buffer = new Buffer(data, "base64");

  pngparse.parse(buffer, function (err, data) {
    if (err) {
      console.warn("Cannot process PNG encoded message ");
    } else {
      const jsonData = data.data.toString();
      callback(JSON.parse(jsonData));
    }
  });
}
