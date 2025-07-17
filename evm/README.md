# Privacy Pool Smart Contract System

This directory contains the Solidity implementation of a privacy pool system that provides on-chain runtime for the deposit and withdrawal logic from the TypeScript scripts.

## Overview

The Privacy Pool smart contract system allows users to deposit ETH and withdraw it anonymously using zero-knowledge proofs. The system maintains privacy by breaking the link between deposits and withdrawals while preventing double-spending through nullifiers.

## Architecture

### Core Components

1. **PrivacyPool.sol** - Main contract managing deposits and withdrawals
2. **MockProofVerifier.sol** - Mock implementation of proof verification for testing
3. **SHA256Lib.sol** - Library for SHA256 hash operations matching TypeScript implementation
4. **MerkleTreeLib.sol** - Library for Merkle tree operations
5. **IProofVerifier.sol** - Interface for proof verification
6. **IMerkleTree.sol** - Interface for Merkle tree operations

### Directory Structure

```
EVM/
├── src/
│   ├── PrivacyPool.sol          # Main privacy pool contract
│   └── MockProofVerifier.sol    # Mock proof verifier for testing
├── lib/
│   ├── SHA256Lib.sol            # SHA256 hash functions
│   └── MerkleTreeLib.sol        # Merkle tree operations
├── interfaces/
│   ├── IProofVerifier.sol       # Proof verifier interface
│   └── IMerkleTree.sol          # Merkle tree interface
├── test/
│   └── PrivacyPoolTest.sol      # Comprehensive test suite
└── README.md                    # This file
```

## How It Works

### 1. Deposit Process

```solidity
// Calculate commitment
uint256 commitment = calculateCommitment(value, secret, nullifier);

// Deposit ETH
privacyPool.deposit{value: 1 ether}(commitment);
```

1. User generates a random `secret` and `nullifier`
2. Commitment is calculated as `SHA256(SHA256(value || secret) || nullifier)`
3. User deposits ETH along with the commitment
4. Commitment is inserted into the Merkle tree
5. Deposit event is emitted

### 2. Withdrawal Process

```solidity
// Generate zero-knowledge proof (off-chain)
bytes memory proof = generateProof(note, merkleTree, withdrawAmount);

// Calculate nullifier hash
uint256 nullifierHash = calculateNullifierHash(nullifier);

// Withdraw
privacyPool.withdraw(
    proof,
    withdrawAmount,
    nullifierHash,
    newCommitment,
    merkleRoot,
    recipient
);
```

1. User generates a zero-knowledge proof off-chain
2. Proof demonstrates knowledge of a valid note without revealing it
3. Contract verifies the proof and checks nullifier hasn't been used
4. Funds are transferred to the recipient
5. Nullifier is stored to prevent double-spending
6. If partial withdrawal, new commitment is added to the tree

### 3. Key Features

- **Privacy**: Deposits and withdrawals are unlinkable
- **Double-spending prevention**: Nullifiers prevent reuse of the same note
- **Partial withdrawals**: Users can withdraw partial amounts
- **Merkle tree verification**: Efficient membership proofs
- **SHA256 hashing**: Matches the TypeScript implementation

## Smart Contract API

### PrivacyPool Contract

#### Public Functions

- `deposit(uint256 commitment)` - Deposit ETH with commitment
- `withdraw(bytes proof, uint256 amount, uint256 nullifierHash, uint256 newCommitment, uint256 merkleRoot, address to)` - Withdraw with proof
- `getMerkleRoot()` - Get current Merkle tree root
- `getLeafCount()` - Get number of leaves in tree
- `commitmentExists(uint256 commitment)` - Check if commitment exists


#### Events

- `Deposit(uint256 indexed commitment, uint256 amount, uint256 leafIndex)`
- `Withdrawal(uint256 indexed nullifierHash, uint256 amount, address to, uint256 newCommitment)`

### MockProofVerifier Contract

#### Public Functions

- `verifyWithdrawalProof(bytes proof, uint256[] publicInputs)` - Verify withdrawal proof
- `setAcceptAllProofs(bool accept)` - Set whether to accept all proofs
- `setProofResult(bytes32 proofHash, bool result)` - Set specific proof result

## Testing

The `PrivacyPoolTest.sol` contract provides comprehensive tests for the system:

### Test Cases

1. **Hash Functions Test** - Verifies SHA256 commitment and nullifier calculations
2. **Deposit Test** - Tests deposit functionality and Merkle tree insertion
3. **Withdrawal Test** - Tests withdrawal with proof verification
4. **Double Spending Test** - Verifies nullifier prevents double-spending
5. **Merkle Tree Test** - Tests tree operations and proofs

### Running Tests

```solidity
// Deploy test contract
PrivacyPoolTest testContract = new PrivacyPoolTest();

// Run all tests
testContract.runAllTests{value: 5 ether}();

// Run individual tests
testContract.testDeposit{value: 1 ether}();
testContract.testWithdrawal();
testContract.testDoubleSpending();
testContract.testMerkleTree{value: 2 ether}();
testContract.testHashFunctions();
```

## Constants

- `TREE_DEPTH`: 20 (supports up to 1M deposits)
- `TREE_ZERO_VALUE`: 0 (empty node value)
- `DENOMINATION`: 1 ether (fixed deposit amount)

## Security Considerations

1. **Proof Verification**: The mock verifier is for testing only. Production requires real ZK proof verification.
2. **Nullifier Storage**: Nullifiers are stored permanently to prevent double-spending.
3. **Merkle Tree**: Uses SHA256 for consistency with TypeScript implementation.
4. **Fixed Denomination**: Currently supports only 1 ETH deposits for simplicity.

## Integration with TypeScript Scripts

The smart contracts are designed to be compatible with the TypeScript scripts:

1. **Hash Functions**: Commitment and nullifier hash calculations are performed client-side, matching the TypeScript implementation
2. **Merkle Tree**: Uses the same SHA256 hashing as the IMT implementation
3. **Proof Format**: Expects the same public input format as generated by the TypeScript proof generation

## Future Enhancements

1. **Real Proof Verification**: Replace mock verifier with actual ZK proof verification
2. **Variable Denominations**: Support multiple deposit amounts
3. **Governance**: Add governance for parameter updates
4. **Gas Optimization**: Optimize for lower gas costs
5. **Upgradability**: Add proxy pattern for contract upgrades

## Usage Example

```solidity
// Deploy contracts
MockProofVerifier verifier = new MockProofVerifier();
PrivacyPool pool = new PrivacyPool(verifier);

// User deposits (calculate commitment client-side)
uint256 value = 1 ether;
uint256 secret = 12345;
uint256 nullifier = 67890;
bytes32 firstHash = sha256(abi.encodePacked(value, secret));
bytes32 commitmentHash = sha256(abi.encodePacked(firstHash, nullifier));
uint256 commitment = uint256(commitmentHash);
pool.deposit{value: 1 ether}(commitment);

// User withdraws (calculate nullifier hash client-side)
bytes memory proof = "..."; // Generated off-chain
bytes32 nullifierHashBytes = sha256(abi.encodePacked(bytes32(0), nullifier));
uint256 nullifierHash = uint256(nullifierHashBytes);
pool.withdraw(proof, 0.5 ether, nullifierHash, 0, pool.getMerkleRoot(), recipient);
```

This smart contract system provides a complete on-chain implementation of the privacy pool functionality, maintaining compatibility with the existing TypeScript scripts while providing the security and decentralization benefits of blockchain deployment. 