import { getTreeAndStorage } from "./lib";

const main = async () => {
  const { storage } = await getTreeAndStorage();

  const note = await storage.getNote();

  console.log("latest note: ", note);
};

main();
