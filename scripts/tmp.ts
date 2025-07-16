import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";
import { generateProof, generateRandomInt, getTreeAndStorage } from "./lib";
import circuit from "../target/privacy_pool.json";

const main = async () => {
  const noir = new Noir(circuit as any);
  const backend = new UltraHonkBackend(circuit.bytecode);

  const inputPoseidon: Array<number> = [];
  const inputPoseidonLength = 64;

  console.log("hash algorithm: poseidon2");
  console.log("tree depth:", inputPoseidonLength);

  for (let i = 0; i < inputPoseidonLength; i++) {
    inputPoseidon.push(i);
  }

  const witnessGenratioBefore = performance.now();
  let { witness } = await noir.execute({
    value: inputPoseidon,
  });
  const witnessGenratioAfter = performance.now();
  console.log(
    "Witness generation time in milliseconds:",
    witnessGenratioAfter - witnessGenratioBefore
  );
  console.log(
    "Witness generation time in seconds:",
    (witnessGenratioAfter - witnessGenratioBefore) / 1000
  );

  const proofGenerationBefore = performance.now();
  await backend.generateProof(witness);
  const proofGenerationAfter = performance.now();
  console.log(
    "Proof generation time in milliseconds:",
    proofGenerationAfter - proofGenerationBefore
  );
  console.log(
    "Proof generation time in seconds:",
    (proofGenerationAfter - proofGenerationBefore) / 1000
  );
};

main();
