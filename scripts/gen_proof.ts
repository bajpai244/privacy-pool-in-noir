import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { getTreeAndStorage } from "./lib";
import circuit from "../target/privacy_pool.json";

const main = async () => {
  const { storage, tree } = await getTreeAndStorage();

  const note = await storage.getNote();

  if (!note) {
    throw new Error("Note not found");
  }

  const noir = new Noir(circuit as any);
  const backend = new UltraHonkBackend(circuit.bytecode);

  const noteCommitmentIndex = tree.indexOf(note.commitment);
  const merkleProof = tree.createProof(noteCommitmentIndex);

  const { witness, returnValue } = await noir.execute({
    note_commitment: note.commitment.toString(),
    merkle_proof_length: merkleProof.siblings.length,
    merkle_proof_indices: merkleProof.pathIndices,
    merkle_proof_siblings: merkleProof.siblings.map(v => {
      return v.toString();
    }),
    merkle_root: tree.root.toString(),
  });

  const proof = await backend.generateProof(witness);
  console.log("proof", proof);

  console.log("merkle root", tree.root.toString(16));
  console.log("return value", returnValue);
};

main();
