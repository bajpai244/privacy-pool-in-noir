export type Note = {
  value: bigint;
  secret: bigint;
  nullifier: bigint;
  // hash of [value, secret]
  commitment: Uint32Array<ArrayBufferLike>;
  // hash of [commitment, nullifier]
  nullifierHash: Uint32Array<ArrayBufferLike>;
};
