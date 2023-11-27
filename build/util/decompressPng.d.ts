export = decompressPng;
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
declare function decompressPng(data: any, callback: decompressPngCallback): void;
declare namespace decompressPng {
    export { decompressPngCallback };
}
type decompressPngCallback = (data: any) => any;
