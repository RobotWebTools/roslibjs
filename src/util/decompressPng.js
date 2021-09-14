/**
 * @fileOverview
 * @author Ramon Wijnands - rayman747@hotmail.com
 */

'use strict';

import pngparse from 'pngparse';

/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function decodes
 * the "image" as a Base64 string.
 *
 * @private
 * @param data - object containing the PNG data.
 * @param callback - function with params:
 *   * data - the uncompressed data
 */
export function decompressPng(data, callback) {
  var buffer = new Buffer(data, 'base64');

  pngparse.parse(buffer, function(err, data) {
    if(err) {
      console.warn('Cannot process PNG encoded message ');
    } else {
      var jsonData = data.data.toString();
      callback(JSON.parse(jsonData));
    }
  });
}
