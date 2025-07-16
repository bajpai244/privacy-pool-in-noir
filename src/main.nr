use std::hash::sha256_compression;

type u256 = [u32; 8];

fn hash_2(inp: [u256; 2]) -> u256 {
    let input = inp[0].concat(inp[1]);

    let state =  [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];

    sha256_compression(input,state)
}

fn hash_3(inp: [u256; 3]) -> u256 {
    let hash = hash_2([inp[0], inp[1]]);
    hash_2([hash, inp[2]])
}

// NOTE: we assume big endian encoding for u256
fn u256_to_field(v: u256) -> Field {

    let mut bytes : [u8; 32]= [0; 32];

    for i in 0..8 {
        bytes[i * 4] = (v[i] >> 24) as u8;
        bytes[i * 4 + 1] = (v[i] >> 16) as u8;
        bytes[i * 4 + 2] = (v[i] >> 8) as u8;
        bytes[i * 4 + 3] = v[i] as u8;
    }

    Field::from_be_bytes(bytes)
}

// returns the new state commitment after withdrawal, if 0 means whole value of the note is consumed
fn main(
    value: u256,
    secret: u256,
    nullifier: u256,
    // new_secret: u256,
    // new_nullifier: u256,
    withdrawAmount: pub Field,
    // merkle_proof_length: u32,
    // merkle_proof_indices: [u1; 16],
    // merkle_proof_siblings: [u256; 16],
    // merkle_root: pub Field,
) -> pub [u256; 2] {

    let value_as_field = u256_to_field(value);

    // check balance is sufficient
    assert(
        (withdrawAmount == value_as_field) | (withdrawAmount.lt(value_as_field)),
        "withdraw amount exceeds balance",
    );

    let commitment = hash_3([value, secret, nullifier]);

    println(commitment);

    [[0;8], [0;8]]
}
