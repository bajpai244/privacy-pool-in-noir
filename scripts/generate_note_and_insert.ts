import { IMT, type IMTNode } from "@zk-kit/imt";
import { poseidon2 } from "poseidon-lite";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import {
  DB_PATH,
  generateNote,
  getTreeAndStorage,
  TREE_ARITY,
  TREE_DEPTH,
  TREE_ZERO_VALUE,
} from "./lib";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = generateNote(100);

  storage.setItem("note", note);
};

main();
