use std::{convert::AsPrimitive, hash::sha256_compression};

type u256 = [u32; 8];

fn hash_1(inp: [u256; 1]) -> u256 {
    let input = [0; 8].concat(inp[0]);

    let state = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];

    sha256_compression(input, state)
}

fn hash_2(inp: [u256; 2]) -> u256 {
    let input = inp[0].concat(inp[1]);

    let state = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];

    sha256_compression(input, state)
}

fn hash_3(inp: [u256; 3]) -> u256 {
    let hash = hash_2([inp[0], inp[1]]);
    hash_2([hash, inp[2]])
}

// NOTE: we assume big endian encoding for u256
fn u256_to_field(v: u256) -> Field {
    let mut bytes: [u8; 32] = [0; 32];

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
    new_secret: u256,
    new_nullifier: u256,
    new_amount: u256,
    withdrawAmount: pub Field,
    merkle_proof_length: u32,
    merkle_proof_indices: [u1; 16],
    merkle_proof_siblings: [u256; 16],
    merkle_root: pub u256,
) -> pub [u256; 2] {
    let value_as_field = u256_to_field(value);
    let new_amount_as_field = u256_to_field(new_amount);

    // check balance is sufficient
    assert(
        (withdrawAmount == value_as_field) | (withdrawAmount.lt(value_as_field)),
        "withdraw amount exceeds balance",
    );

    let commitment = hash_3([value, secret, nullifier]);

    let _merkle_root = binary_merkle_root(
        hash_2,
        commitment,
        merkle_proof_length,
        merkle_proof_indices,
        merkle_proof_siblings,
    );
    println(merkle_root);

    assert(merkle_root == _merkle_root, "merkle roots don't match");

    let new_balance = value_as_field - withdrawAmount;
    assert(
        new_balance == new_amount_as_field,
        "new balance does not match the one provided in circuit",
    );

    let nullifier_hash = hash_1([nullifier]);

    if new_balance == 0 {
        [nullifier_hash, [0; 8]]
    } else {
        // return new state commitment
        [nullifier_hash, hash_3([new_amount, new_secret, new_nullifier])]
    }
}

pub fn binary_merkle_root<let MAX_DEPTH: u32>(
    hasher: fn([u256; 2]) -> u256,
    leaf: u256,
    depth: u32,
    indices: [u1; MAX_DEPTH],
    siblings: [u256; MAX_DEPTH],
) -> u256 {
    // Start from the leaf node
    let mut node = leaf;

    // Iterate through the Merkle proof up to MAX_DEPTH
    for i in 0..MAX_DEPTH {
        // Only compute hash if the current level is within the tree depth
        if i < depth {
            let sibling = siblings[i];

            // Determine the ordering of node and sibling based on the index bit
            // If indices[i] == 0, node is on the left; otherwise, it's on the right
            let (left, right) = if indices[i] == 0 {
                (node, sibling)
            } else {
                (sibling, node)
            };

            // Hash the pair to move one level up the tree
            node = hasher([left, right]);
        }
    }

    // Return the root computed
    node
}
