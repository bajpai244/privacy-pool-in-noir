use binary_merkle_root::binary_merkle_root;
use poseidon::poseidon::bn254::{hash_2, hash_3};

// returns the new state commitment after withdrawal, if 0 means whole value of the note is consumed
fn main(
    value: Field,
    secret: Field,
    nullifier: Field,
    newSecret: Field,
    newNullifier: Field,
    withdrawAmount: pub Field,
    merkle_proof_length: u32,
    merkle_proof_indices: [u1; 16],
    merkle_proof_siblings: [Field; 16],
    merkle_root: pub Field,
) -> pub Field {
    // check balance is sufficient
    assert(
        (withdrawAmount == value) | (withdrawAmount.lt(value)),
        "withdraw amount exceeds balance",
    );

    let commitment = hash_3([value, secret, nullifier]);

    // Calculate Merkle root.
    let _merkle_root = binary_merkle_root(
        hash_2,
        commitment,
        merkle_proof_length,
        merkle_proof_indices,
        merkle_proof_siblings,
    );

    assert(merkle_root == _merkle_root, "merkle roots don't match");

    let new_balance = value - withdrawAmount;

    if new_balance == 0 {
        0
    } else {
        // return new state commitment
        hash_3([new_balance, secret, nullifier])
    }
}

#[test]
fn test_main() {
    // Uncomment to make test fail
    // main(1, 1);
}
