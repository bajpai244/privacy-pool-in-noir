import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import {
  calculateCommitment,
  generateProof,
  generateRandomInt,
  getTreeAndStorage,
  sha256Compression,
  sha256ImtVersion,
  TREE_ARITY,
  TREE_DEPTH,
  TREE_ZERO_VALUE,
  u256FromArrayBE,
  u256ToArrayBE,
  Uint32ArrayToBigIntArray,
} from "./lib";
import circuit from "../target/privacy_pool.json";
import { hash, SHA256, SHA512_256 } from "bun";
import { sha256_compression } from "@aztec/noir-acvm_js";
import { IMT } from "@zk-kit/imt";

const main = async () => {
  const noir = new Noir(circuit as any);
  const backend = new UltraHonkBackend(circuit.bytecode);

  const tree = new IMT(
    sha256ImtVersion,
    TREE_DEPTH,
    TREE_ZERO_VALUE,
    TREE_ARITY
  );

  // const { witness, returnValue } = await noir.execute({
  //   value: inputSha256,
  //   state: state,
  // });

  // console.log("return value:", returnValue);

  const value = 123456n;
  const secret = 32n;
  const nullifier = 64n;

  const valueArray = u256ToArrayBE(value);
  const secretArray = u256ToArrayBE(secret);
  const nullifierArray = u256ToArrayBE(nullifier);

  console.log(
    "valueArray:",
    valueArray.map(v => {
      return v.toString();
    })
  );
  console.log(
    "secretArray:",
    secretArray.map(v => {
      return v.toString();
    })
  );
  console.log(
    "nullifierArray:",
    nullifierArray.map(v => {
      return v.toString();
    })
  );

  const commitment = calculateCommitment(value, secret, nullifier);
  console.log("commitment:", commitment);

  const commitmentU256 = u256FromArrayBE(Uint32ArrayToBigIntArray(commitment));

  console.log("Tree root before insertion:", tree.root.toString(16));
  tree.insert(commitmentU256);
  console.log("Tree root after insertion:", tree.root.toString(16));

  console.log("tree root:", u256ToArrayBE(BigInt(tree.root)));

  const index = tree.indexOf(commitmentU256);
  const merkleProof = tree.createProof(index);

  console.log("Merkle proof length:", merkleProof.siblings.length);
  console.log(
    "Merkle proof indices:",
    merkleProof.pathIndices.map(v => v.toString())
  );
  console.log(
    "Merkle proof siblings:",
    merkleProof.siblings.map(v => {
      const ele = v[0];
      const eleU32Array = u256ToArrayBE(BigInt(ele));

      return eleU32Array.map(e => e.toString());
    })
  );
};

main();
