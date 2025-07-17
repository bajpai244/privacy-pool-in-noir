import {
  generateProof,
  getTreeAndStorage,
  u256FromArrayBE,
  verifyProof,
} from "./lib";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = await storage.getNote();
  if (!note) {
    throw new Error("Note not found");
  }

  const now = performance.now();
  const { proof, newNote } = await generateProof(note, tree, 10n);
  const end = performance.now();
  console.log(`Proof generation took ${end - now}ms`);

  const withdrawAmount = proof.publicInputs[0];
  const merkleRoot = u256FromArrayBE(
    proof.publicInputs.slice(1, 9).map(v => BigInt(v))
  );
  const nullifierHash = u256FromArrayBE(
    proof.publicInputs.slice(9, 17).map(v => BigInt(v))
  );
  const newCommitment = u256FromArrayBE(
    proof.publicInputs.slice(17, 25).map(v => BigInt(v))
  );

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

  console.log("withdrawal processed successfully for amount: ", withdrawAmount);

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
