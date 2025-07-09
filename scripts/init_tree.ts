/*
creates a new empty merkle tree, with the poseidon2 hash function
it saves the tree to a file: tree.json at the project root
*/

import { IMT } from "@zk-kit/imt";
import { poseidon2 } from "poseidon-lite";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { DB_PATH, TREE_ARITY, TREE_DEPTH, TREE_ZERO_VALUE } from "./lib";

const main = async () => {
  // Create a storage instance that saves data in the ./data directory
  const storage = createStorage({
    driver: fsDriver({ base: DB_PATH }),
  });

  await storage.clear();

  const tree = new IMT(poseidon2, TREE_DEPTH, TREE_ZERO_VALUE, TREE_ARITY);

  await storage.setItem("tree:leaves", tree.leaves);

  console.log("Tree initialized and saved to", DB_PATH);
};

main();
