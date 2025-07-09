import { generateNote, getTreeAndStorage } from "./lib";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = generateNote(100);
  await storage.setNote(note);

  console.log("tree root before insert", tree.root);
  console.log("Inserting note into tree");

  tree.insert(note.commitment);
  await storage.setLeaves(tree.leaves.map(leaf => leaf.toString()));

  console.log("tree root after insert", tree.root);

  console.log("inserted note into tree: ", note);
};

main();
