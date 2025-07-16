import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import {
  calculateCommitment,
  generateProof,
  generateRandomInt,
  getTreeAndStorage,
  sha256Compression,
  u256FromU32ArrayBE,
  u256ToU32ArrayBE,
} from "./lib";
import circuit from "../target/privacy_pool.json";
import { hash, SHA256, SHA512_256 } from "bun";
import { sha256_compression } from "@aztec/noir-acvm_js";

const main = async () => {
  const noir = new Noir(circuit as any);
  const backend = new UltraHonkBackend(circuit.bytecode);

  // const { witness, returnValue } = await noir.execute({
  //   value: inputSha256,
  //   state: state,
  // });

  // console.log("return value:", returnValue);

  const value = 123456n;
  const secret = 32n;
  const nullifier = 64n;


  const valueArray = u256ToU32ArrayBE(value);
  const secretArray = u256ToU32ArrayBE(secret);
  const nullifierArray = u256ToU32ArrayBE(nullifier);

  console.log("valueArray:", valueArray.map((v) => {
    return v.toString();
  })  );
  console.log("secretArray:", secretArray.map((v) => {
    return v.toString();
  }));
  console.log("nullifierArray:", nullifierArray.map((v) => {
    return v.toString();
  }));

  const commitment = calculateCommitment(value, secret, nullifier);
  console.log("commitment:", commitment);

};

main();
