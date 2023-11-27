export = cborTypedArrayTagger;
/**
 * Handle CBOR typed array tags during decoding.
 * @param {Uint8Array} data
 * @param {Number} tag
 */
declare function cborTypedArrayTagger(data: Uint8Array, tag: number): any;
