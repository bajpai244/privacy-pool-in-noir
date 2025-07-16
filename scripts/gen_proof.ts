import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import {
  generateProof,
  generateRandomInt,
  getTreeAndStorage,
  u256FromArrayBE,
} from "./lib";
import circuit from "../target/privacy_pool.json";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = await storage.getNote();

  if (!note) {
    throw new Error("Note not found");
  }

  const { proof } = await generateProof(note, tree, BigInt(50));

  console.log("proof", proof);

  // console.log("merkle root", tree.root.toString(16));
  console.log("public inputs", proof.publicInputs);
  console.log("public inputs length", proof.publicInputs.length);

  const withdrawAmount = proof.publicInputs[0];
  const merkle_root = proof.publicInputs.slice(1, 9);
  const nullifier = proof.publicInputs.slice(9, 17);
  const new_commitment = proof.publicInputs.slice(17, 25);

  console.log("withdrawAmount:", withdrawAmount);
  console.log(
    "merkle_root:",
    u256FromArrayBE(
      merkle_root.map(v => {
        return BigInt(v);
      })
    )
  );
  console.log(
    "nullifier:",
    u256FromArrayBE(
      nullifier.map(v => {
        return BigInt(v);
      })
    )
  );
  console.log(
    "new_commitment:",
    u256FromArrayBE(
      new_commitment.map(v => {
        return BigInt(v);
      })
    )
  );
};

main();
