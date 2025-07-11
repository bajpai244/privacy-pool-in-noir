import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import circuit from "../../circuit/privacy_pool.json"
import { Note } from "./types";
import { IMT } from "@zk-kit/imt";
import { poseidon1, poseidon3 } from "poseidon-lite";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const generateProof = async (
  note: Note,
  tree: IMT,
  value?: number
): Promise<{ proof: ProofData; newNote: Note | null }> => {
  const noir = new Noir(circuit as any);
  const backend = new UltraHonkBackend(circuit.bytecode);

  const noteCommitmentIndex = tree.indexOf(note.commitment);
  const merkleProof = tree.createProof(noteCommitmentIndex);

  const withdrawAmount = value ? value : note.value;

  const newNoteValue = note.value - withdrawAmount;
  const newNoteSecret = generateRandomInt();
  const newNoteNullifier = generateRandomInt();

  const { witness } = await noir.execute({
    value: note.value,
    secret: note.secret,
    nullifier: note.nullifier,
    new_secret: newNoteSecret,
    new_nullifier: newNoteNullifier,
    withdrawAmount: withdrawAmount,
    merkle_proof_length: merkleProof.siblings.length,
    merkle_proof_indices: merkleProof.pathIndices,
    merkle_proof_siblings: merkleProof.siblings.map(v => {
      return v.toString();
    }),
    merkle_root: tree.root.toString(),
  });

  const proof = await backend.generateProof(witness);

  return {
    proof,
    newNote: newNoteValue
      ? {
          value: newNoteValue,
          secret: newNoteSecret,
          nullifier: newNoteNullifier,
          commitment: poseidon3([
            newNoteValue,
            newNoteSecret,
            newNoteNullifier,
          ]),
          nullifierHash: poseidon1([newNoteNullifier]),
        }
      : null,
  };
};

export const generateRandomInt = () => {
  return Math.floor(Math.random() * 1000000);
};