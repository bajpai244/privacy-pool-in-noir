export type Note = {
  value: number;
  secret: number;
  nullifier: number;
  // hash of [value, secret]
  commitment: bigint;
  // hash of [commitment, nullifier]
  nullifierHash: bigint;
};
