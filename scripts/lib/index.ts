import { IMT } from "@zk-kit/imt";
import { poseidon1, poseidon2, poseidon3 } from "poseidon-lite";
import { DB_PATH, TREE_ARITY, TREE_DEPTH, TREE_ZERO_VALUE } from "./constants";
import { Storage } from "./storage";
import type { Note } from "../types";
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, type ProofData } from "@aztec/bb.js";
import circuit from "../../target/privacy_pool.json";
import {
  bigIntArrayToUint32Array,
  calculateCommitment,
  calculateNullifierHash,
  sha256Compression,
  sha256ImtVersion,
  u256FromU32ArrayBE,
  u256ToArrayBE,
  u256ToU32ArrayBE,
} from "./utils";

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
    sha256ImtVersion,
    TREE_DEPTH,
    TREE_ZERO_VALUE,
    TREE_ARITY,
    treeLeaves
  );

  return { storage, tree };
};

// NOTE: in production, we should use a secure random number generator
export const generateNote = (value: bigint) => {
  const secret = generateRandomIntBigInt();
  const nullifier = generateRandomIntBigInt();

  const commitment = calculateCommitment(value, secret, nullifier);
  const nullifierHash = calculateNullifierHash(nullifier);

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
  value?: bigint
): Promise<{ proof: ProofData; newNote: Note | null }> => {
  const noir = new Noir(circuit as any);
  const backend = new UltraHonkBackend(circuit.bytecode);

  const noteCommitmentIndex = tree.indexOf(u256FromU32ArrayBE(note.commitment));
  const merkleProof = tree.createProof(noteCommitmentIndex);

  const withdrawAmount = value ? value : note.value;

  const newNoteValue = note.value - withdrawAmount;
  const newNoteSecret = generateRandomIntBigInt();
  const newNoteNullifier = generateRandomIntBigInt();

  const { witness, returnValue } = await noir.execute({
    value: u256ToArrayBE(note.value).map(v => v.toString()),
    secret: u256ToArrayBE(note.secret).map(v => v.toString()),
    nullifier: u256ToArrayBE(note.nullifier).map(v => v.toString()),
    new_secret: u256ToArrayBE(newNoteSecret).map(v => v.toString()),
    new_nullifier: u256ToArrayBE(newNoteNullifier).map(v => v.toString()),
    new_amount: u256ToArrayBE(newNoteValue).map(v => v.toString()),
    withdrawAmount: withdrawAmount.toString(),
    merkle_proof_length: merkleProof.siblings.length,
    merkle_proof_indices: merkleProof.pathIndices,
    merkle_proof_siblings: merkleProof.siblings.map(v => {
      const ele = v[0];
      const eleU32Array = u256ToArrayBE(BigInt(ele));

      return eleU32Array.map(e => e.toString());
    }),
    merkle_root: u256ToArrayBE(BigInt(tree.root)).map(v => v.toString()),
  });

  // console.log("circuit inputs:", {
  //   value: u256ToArrayBE(note.value).map(v => v.toString()),
  //   secret: u256ToArrayBE(note.secret).map(v => v.toString()),
  //   nullifier: u256ToArrayBE(note.nullifier).map(v => v.toString()),
  //   new_secret: u256ToArrayBE(newNoteSecret).map(v => v.toString()),
  //   new_nullifier: u256ToArrayBE(newNoteNullifier).map(v => v.toString()),
  //    new_amount: u256ToArrayBE(newNoteValue).map(v => v.toString()),
  //   withdrawAmount: withdrawAmount.toString(),
  //   merkle_proof_length: merkleProof.siblings.length,
  //   merkle_proof_indices: merkleProof.pathIndices,
  //   merkle_proof_siblings: merkleProof.siblings.map(v => {
  //     const ele = v[0];
  //     const eleU32Array = u256ToArrayBE(BigInt(ele));

  //     return eleU32Array.map(e => e.toString());
  //   }),
  //   merkle_root: u256ToArrayBE(BigInt(tree.root)).map(v => v.toString()),
  // });

  // console.log("return value:", returnValue);

  const proof = await backend.generateProof(witness);

  // console.log("expected merkle root", tree.root);
  // console.log(
  //   "expected nullifier",
  //   u256FromU32ArrayBE(calculateNullifierHash(note.nullifier))
  // );
  // console.log(
  //   "expected commitment",
  //   u256FromU32ArrayBE(
  //     calculateCommitment(newNoteValue, newNoteSecret, newNoteNullifier)
  //   )
  // );

  return {
    proof,
    newNote: newNoteValue
      ? {
          value: newNoteValue,
          secret: newNoteSecret,
          nullifier: newNoteNullifier,
          commitment: calculateCommitment(
            newNoteValue,
            newNoteSecret,
            newNoteNullifier
          ),
          nullifierHash: calculateNullifierHash(newNoteNullifier),
        }
      : null,
  };
};

export const verifyProof = async (proof: ProofData) => {
  const backend = new UltraHonkBackend(circuit.bytecode);

  return await backend.verifyProof(proof);
};
