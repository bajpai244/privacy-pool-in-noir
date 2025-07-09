use binary_merkle_root::binary_merkle_root;
use poseidon::poseidon::bn254::hash_2;

fn main(
    note_commitment: Field,
    merkle_proof_length: u32,
    merkle_proof_indices: [u1; 16],
    merkle_proof_siblings: [Field; 16],
    merkle_root: pub Field,
) -> pub Field {

    // Calculate Merkle root.
    let _merkle_root = binary_merkle_root(
        hash_2,
        note_commitment,
        merkle_proof_length,
        merkle_proof_indices,
        merkle_proof_siblings,
    );

    assert(merkle_root == _merkle_root, "merkle roots don't match");

    _merkle_root
    // 2
}

#[test]
fn test_main() {
    // Uncomment to make test fail
    // main(1, 1);
}
