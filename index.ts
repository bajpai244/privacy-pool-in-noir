import { IMT } from "@zk-kit/imt";
import { poseidon1, poseidon2 } from "poseidon-lite";

const main = async () => {
  const depth = 16;
  const zeroValue = 0;
  const arity = 2;

  const tree = new IMT(poseidon2, depth, zeroValue, arity);

  tree.insert(1);
  tree.insert(2);

  // const hash = poseidon1([1)
  // console.log("poseidon2 hash:", hash.toString(16));
  // console.log('poseidon', poseidon2(["0x1"]))

  const proof = tree.createProof(0);
  console.log(tree.verifyProof(proof));

  console.log("note_committment:", `"${proof.leaf}"`);
  console.log(
    "merkle_proof_indices:",
    "[",
    proof.pathIndices
      .map(v => {
        return `"${v}"`;
      })
      .join(", "),
    "]"
  );
  console.log(
    "merkle_proof_siblings:",
    "[",
    proof.siblings
      .map(v => {
        return `"${v}"`;
      })
      .join(", "),
    "]"
  );
  console.log("merkle_proof_length:", `"${proof.siblings.length}"`);

  console.log("merkle_proof_root:", `"${proof.root}"`);

  // console.log('proof', proof);
};

main();
