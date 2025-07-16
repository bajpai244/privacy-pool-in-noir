import { IMT } from "@zk-kit/imt";
import { poseidon1, poseidon2, poseidon3 } from "poseidon-lite";
import { DB_PATH, TREE_ARITY, TREE_DEPTH, TREE_ZERO_VALUE } from "./constants";
import { Storage } from "./storage";
import type { Note } from "../types";
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, type ProofData } from "@aztec/bb.js";
import circuit from "../../target/privacy_pool.json";

export * from "./constants";
export * from "./utils";

export const getTreeAndStorage = async () => {
  const storage = new Storage(DB_PATH);

  const treeLeaves = await storage.getLeaves();

  // post running init_tree.ts, tree leaves are saved to the storage
  if (!treeLeaves) {
    throw new Error("Tree leaves not found");
  }

  const tree = new IMT(
    poseidon2,
    TREE_DEPTH,
    TREE_ZERO_VALUE,
    TREE_ARITY,
    treeLeaves
  );

  return { storage, tree };
};

// NOTE: in production, we should use a secure random number generator
export const generateNote = (value: number) => {
  const secret = generateRandomInt();
  const nullifier = generateRandomInt();

  const commitment = poseidon3([value, secret, nullifier]);
  const nullifierHash = poseidon1([nullifier]);

  return {
    value,
    secret,
    nullifier,
    commitment: commitment,
    nullifierHash: nullifierHash,
  };
};

export const generateRandomInt = () => {
  return Math.floor(Math.random() * 1000000);
};

export const generateRandomIntBigInt = () => {
  return BigInt(generateRandomInt());
};

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

export const verifyProof = async (proof: ProofData) => {
  const backend = new UltraHonkBackend(circuit.bytecode);

  return await backend.verifyProof(proof);
};
