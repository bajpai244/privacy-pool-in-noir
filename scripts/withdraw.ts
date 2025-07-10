import { Noir } from "@noir-lang/noir_js";
import { generateProof, getTreeAndStorage, verifyProof } from "./lib";
import { Barretenberg } from "@aztec/bb.js";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = await storage.getNote();
  if (!note) {
    throw new Error("Note not found");
  }

  const { proof, newNote } = await generateProof(note, tree, 10);

  const [value, nullifierHash, newCommitment] = proof.publicInputs.map(v => {
    return BigInt(v);
  });

  const proofVerification = await verifyProof(proof);
  if (!proofVerification) {
    throw new Error("Proof verification failed");
  }

  const nullifierExists = await storage.nullifierHashExists(nullifierHash);
  if (nullifierExists) {
    throw new Error("Nullifier already exists, withdrawal already processed");
  }

  await storage.insertNullifierHash(nullifierHash);
  console.log("Inserted nullifier hash into storage");

  console.log("withdrawal processed successfully for amount: ", value);

  if (newNote) {
    console.log("inserting new commitment into tree");
    tree.insert(newCommitment);
    await storage.setLeaves(tree.leaves);

    console.log("tree root after insert", tree.root.toString(16));

    console.log(
      "new commitment inserted into tree: ",
      newCommitment.toString(16)
    );

    await storage.setNote(newNote);
    console.log("new note saved to storage: ", newNote);
  } else {
    await storage.removeNote();
    console.log("no new commitment generated, complete amount withdrawn");
  }
};

main();
