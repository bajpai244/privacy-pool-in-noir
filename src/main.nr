use std::hash::poseidon2::Poseidon2::hash;

fn main(x: [Field; 100000]) -> pub Field {
    let mut v: Field = 0;

    for i in 0..100000 {
        v = hash([x[i], v], 2);
    }

    v
}

#[test]
fn test_main() {
    // Uncomment to make test fail
    // main(1, 1);
}
