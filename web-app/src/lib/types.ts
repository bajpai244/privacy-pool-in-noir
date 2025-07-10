// Types for the privacy pool web app
export type IMTNode = number | string | bigint;

export type Note = {
  value: number;
  secret: number;
  nullifier: number;
  // hash of [value, secret, nullifier]
  commitment: bigint;
  // hash of [nullifier]
  nullifierHash: bigint;
};

export type BalanceData = {
  accountBalance: number;
  poolBalance: number;
}; 