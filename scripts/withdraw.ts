import { getTreeAndStorage } from "./lib";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = await storage.getNote();
  if (!note) {
    throw new Error("Note not found");
  }
};

main();
