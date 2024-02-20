/**
 * @fileOverview
 * @author Ramon Wijnands - rayman747@hotmail.com
 */

'use strict';

import pngparse from 'pngparse';

/**
 * @callback decompressPngCallback
 * @param data - The uncompressed data.
 */
/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function decodes
 * the "image" as a Base64 string.
 *
 * @private
 * @param data - An object containing the PNG data.
 * @param {decompressPngCallback} callback - Function with the following params:
 */
export default function decompressPng(data, callback) {
  var buffer = new Buffer(data, 'base64');

  pngparse.parse(buffer, function (err, data) {
    if (err) {
      console.warn('Cannot process PNG encoded message ');
    } else {
      var jsonData = data.data.toString();
      callback(JSON.parse(jsonData));
    }
  });
}
