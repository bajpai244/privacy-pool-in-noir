import { sha256_compression } from "@aztec/noir-acvm_js";
import type { IMT, IMTNode } from "@zk-kit/imt";

export const u256ToArrayBE = (bigInt: bigint) => {
  const array = new Array(8).fill(0n); // Store BigInts!
  let remaining = bigInt;

  for (let i = 7; i >= 0; i--) {
    array[i] = remaining & 0xffffffffn; // Keep as BigInt
    remaining = remaining >> 32n;
  }

  return array;
};

export const u256FromArrayBE = (array: Array<bigint>) => {
  // Accept BigInts
  if (array.length !== 8) {
    throw new Error("Array must be of length 8");
  }

  let bigInt = 0n;
  for (let i = 0; i < 8; i++) {
    bigInt = (bigInt << 32n) | array[i]; // No conversion needed!
  }

  return bigInt;
};

export const u256ToU32ArrayBE = (bigInt: bigint) => {
  const array = u256ToArrayBE(bigInt);
  return bigIntArrayToUint32Array(array);
};

export const u256FromU32ArrayBE = (array: Uint32Array) => {
  const bigIntArray = Array.from(array).map(v => {
    return BigInt(v);
  });

  return u256FromArrayBE(bigIntArray);
};

export const sha256Compression = (value: Uint32Array) => {
  if (value.length !== 16) {
    throw new Error("Invalid input length for SHA-256 compression");
  }

  const state = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);

  return sha256_compression(value, state);
};

export const sha256ImtVersion = (input: IMTNode[]): IMTNode => {
  if (input.length !== 2) {
    throw new Error("Input must be an array of length 2");
  }

  const values = input.map(v => {
    return BigInt(v);
  });

  const valuesAsU32Array = values.map(v => {
    return u256ToArrayBE(v);
  });

  const sha256Input = bigIntArrayToUint32Array(
    valuesAsU32Array[0].concat(valuesAsU32Array[1])
  );
  const hash = sha256Compression(sha256Input);

  const hashBigIntArray: Array<bigint> = Uint32ArrayToBigIntArray(hash);
  const hashBigInt = u256FromArrayBE(hashBigIntArray);

  return hashBigInt;
};

export const bigIntArrayToUint32Array = (array: Array<bigint>) => {
  return new Uint32Array(
    array.map(v => {
      return Number.parseInt(v.toString());
    })
  );
};

export const Uint32ArrayToBigIntArray = (array: Uint32Array) => {
  return Array.from(array).map(v => {
    return BigInt(v);
  });
};

export const calculateCommitment = (
  value: bigint,
  secret: bigint,
  nullifier: bigint
) => {
  const valueArray = u256ToArrayBE(value);
  const secretArray = u256ToArrayBE(secret);
  const nullifierArray = u256ToArrayBE(nullifier);

  const input1 = bigIntArrayToUint32Array(valueArray.concat(secretArray));
  const hash = sha256Compression(input1);

  const hashBigIntArray = Array.from(hash).map(v => {
    return BigInt(v);
  });

  const input2 = bigIntArrayToUint32Array(
    hashBigIntArray.concat(nullifierArray)
  );
  const commitment = sha256Compression(input2);

  return commitment;
};

export const calculateNullifierHash = (nullifier: bigint) => {
  const zeroArray = new Array(8).fill(0);
  const nullifierArray = u256ToArrayBE(nullifier);

  const input = bigIntArrayToUint32Array(zeroArray.concat(nullifierArray));
  console.log("nullifier input:", input);
  return sha256Compression(input);
};
