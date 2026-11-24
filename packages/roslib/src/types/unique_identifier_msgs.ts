export namespace unique_identifier_msgs {
  export interface UUID {
    /** Base64 in rosbridge JSON; bytes in CBOR or array-based transports. */
    uuid: string | number[] | Uint8Array;
  }
}
