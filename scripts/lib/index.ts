import { IMT, type IMTNode } from "@zk-kit/imt";
import { poseidon2 } from "poseidon-lite";
import { DB_PATH, TREE_ARITY, TREE_DEPTH, TREE_ZERO_VALUE } from "./constants";
import { Storage } from "./storage";

export * from "./constants";

export const getTreeAndStorage = async () => {
  const storage = new Storage(DB_PATH);

  const treeLeaves = await storage.getLeaves();

  // post running init_tree.ts, tree leaves are saved to the storage
  if (!treeLeaves) {
    throw new Error("Tree leaves not found");
  }

  const tree = new IMT(
    poseidon2,
    TREE_DEPTH,
    TREE_ZERO_VALUE,
    TREE_ARITY,
    treeLeaves
  );

  return { storage, tree };
};

// NOTE: in production, we should use a secure random number generator
export const generateNote = (value: number) => {
  const secret = Math.floor(Math.random() * 1000000);
  const nullifier = Math.floor(Math.random() * 1000000);

  const commitment = poseidon2([value, secret]);
  const nullifierHash = poseidon2([commitment, nullifier]);

  return {
    value,
    secret,
    nullifier,
    commitment: commitment,
    nullifierHash: nullifierHash,
  };
};
