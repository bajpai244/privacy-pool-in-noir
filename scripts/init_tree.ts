/*
creates a new empty merkle tree, with the poseidon2 hash function
it saves the tree to a file: tree.json at the project root
*/

import { poseidon2 } from "poseidon-lite";
import { DB_PATH, TREE_ARITY, TREE_DEPTH, TREE_ZERO_VALUE } from "./lib";
import { Storage } from "./lib/storage";
import { IMT } from "@zk-kit/imt";

const main = async () => {
  const storage = new Storage(DB_PATH);
  await storage.clear();

  const tree = new IMT(poseidon2, TREE_DEPTH, TREE_ZERO_VALUE, TREE_ARITY);

  await storage.setLeaves(tree.leaves);

  console.log("Tree initialized and saved to", DB_PATH);
};

main();
