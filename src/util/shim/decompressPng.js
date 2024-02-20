/**
 * @fileOverview
 * @author Graeme Yeates - github.com/megawac
 */

/**
 * @callback decompressPngCallback
 * @param data - The uncompressed data.
 */
/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function places the
 * "image" in a canvas element then decodes the * "image" as a Base64 string.
 *
 * @private
 * @param data - An object containing the PNG data.
 * @param {decompressPngCallback} callback - Function with the following params:
 */
export default function decompressPng(data, callback) {
  // Uncompresses the data before sending it through (use image/canvas to do so).
  var image = new Image();
  // When the image loads, extracts the raw data (JSON message).
  image.onload = function () {
    // Creates a local canvas to draw on.
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to create Canvas context!');
    }

    // Sets width and height.
    canvas.width = image.width;
    canvas.height = image.height;

    // Prevents anti-aliasing and loosing data
    context.imageSmoothingEnabled = false;

    // Puts the data into the image.
    context.drawImage(image, 0, 0);
    // Grabs the raw, uncompressed data.
    var imageData = context.getImageData(0, 0, image.width, image.height).data;

    // Constructs the JSON.
    var jsonData = '';
    for (var i = 0; i < imageData.length; i += 4) {
      // RGB
      jsonData += String.fromCharCode(
        imageData[i],
        imageData[i + 1],
        imageData[i + 2]
      );
    }
    callback(JSON.parse(jsonData));
  };
  // Sends the image data to load.
  image.src = 'data:image/png;base64,' + data;
}
