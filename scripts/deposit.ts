import { generateNote, getTreeAndStorage, u256FromU32ArrayBE } from "./lib";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = generateNote(100n);
  await storage.setNote(note);

  console.log("tree root before insert", tree.root);
  console.log("Inserting note into tree");

  const treeLeaf = u256FromU32ArrayBE(note.commitment);
  console.log("tree leaf:", treeLeaf);

  tree.insert(treeLeaf);
  await storage.setLeaves(tree.leaves);

  console.log("tree root after insert", tree.root);

  console.log("inserted note into tree: ", note);
};

main();
