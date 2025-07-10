import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { generateProof, generateRandomInt, getTreeAndStorage } from "./lib";
import circuit from "../target/privacy_pool.json";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = await storage.getNote();

  if (!note) {
    throw new Error("Note not found");
  }

  const proof = await generateProof(note, tree);

  console.log("proof", proof);

  console.log("merkle root", tree.root.toString(16));
  console.log("public inputs", proof.publicInputs);
};

main();
