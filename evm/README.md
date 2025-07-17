# Privacy Pool - EVM Implementation (Pseudo Code)

## ⚠️ Important Notice

This is **pseudo code** and **proof-of-concept** implementation designed to demonstrate how a privacy-preserving mixer (Privacy Pool) would work in a production environment. **Do not use this code in production** without proper auditing, testing, and security reviews.

## 🎯 Purpose

This implementation serves as an educational resource and architectural reference for building privacy-preserving financial systems on Ethereum. It demonstrates:

- Zero-knowledge proof integration patterns
- Merkle tree-based commitment schemes
- Historical state validation
- Secure withdrawal mechanisms
- Privacy-preserving transaction flows

## 🏗️ Architecture Overview

### Core Components

1. **PrivacyPool.sol** - Main contract handling deposits and withdrawals
2. **MockProofVerifier.sol** - Simplified proof verification (production would use real ZK verifiers)
3. **MerkleTreeLib.sol** - Library for managing commitment trees with 100-root history
4. **SHA256Lib.sol** - Cryptographic utilities for hashing operations

### Key Features

- **Fixed Denomination**: 1 ETH deposits for simplicity
- **Merkle Tree History**: Tracks last 100 roots for flexible withdrawal timing
- **Nullifier Protection**: Prevents double-spending through nullifier tracking
- **Zero-Knowledge Proofs**: Enables anonymous withdrawals (mocked for demonstration)
- **Partial Withdrawals**: Supports withdrawing portions of deposits

## 🔒 Privacy Model

### Deposit Flow
1. User generates a secret commitment hash
2. Deposits 1 ETH along with the commitment
3. Commitment is added to the merkle tree
4. Tree root is updated and added to history

### Withdrawal Flow
1. User creates a zero-knowledge proof off-chain
2. Proof contains: withdrawal amount, merkle root, nullifier, new commitment
3. Contract verifies proof and extracts public inputs
4. Validates merkle root against historical roots (last 100)
5. Checks nullifier hasn't been used before
6. Transfers funds anonymously to recipient

## 📁 File Structure

```
evm/
├── src/
│   ├── PrivacyPool.sol           # Main privacy pool contract
│   └── MockProofVerifier.sol     # Mock zero-knowledge proof verifier
├── lib/
│   ├── MerkleTreeLib.sol         # Merkle tree with history tracking
│   └── SHA256Lib.sol             # Cryptographic utilities
├── interfaces/
│   ├── IProofVerifier.sol        # Proof verifier interface
│   └── IMerkleTree.sol           # Merkle tree interface
├── test/
│   └── PrivacyPoolTest.sol       # Integration tests demonstrating flows
└── README.md                     # This file
```
