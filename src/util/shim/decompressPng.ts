/**
 * @fileOverview
 * @author Graeme Yeates - github.com/megawac
 */

/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function places the
 * "image" in a canvas element then decodes the * "image" as a Base64 string.
 *
 * @param data - A string containing the PNG data.
 * @param callback - Function with the following params:
 */
export default function decompressPng(
  data: string,
  callback: (data: unknown) => void,
) {
  // Uncompresses the data before sending it through (use image/canvas to do so).
  const image = new Image();
  // When the image loads, extracts the raw data (JSON message).
  image.onload = function () {
    // Creates a local canvas to draw on.
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Failed to create Canvas context!");
    }

    // Sets width and height.
    canvas.width = image.width;
    canvas.height = image.height;

    // Prevents anti-aliasing and loosing data
    context.imageSmoothingEnabled = false;

    // Puts the data into the image.
    context.drawImage(image, 0, 0);
    // Grabs the raw, uncompressed data.
    const imageData = context.getImageData(
      0,
      0,
      image.width,
      image.height,
    ).data;

    // Constructs the JSON.
    let jsonData = "";
    for (let i = 0; i < imageData.length; i += 4) {
      // RGB
      jsonData += String.fromCharCode(
        imageData[i],
        imageData[i + 1],
        imageData[i + 2],
      );
    }
    callback(JSON.parse(jsonData));
  };
  // Sends the image data to load.
  image.src = `data:image/png;base64,${data}`;
}
