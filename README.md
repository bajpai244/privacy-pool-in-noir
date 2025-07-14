# Privacy Pool

A privacy-preserving mixing pool implementation using Noir zero-knowledge proofs. This project allows users to deposit and withdraw funds while maintaining transaction privacy through cryptographic commitments and Merkle tree proofs.

## How It Works

Privacy Pool operates on the principle of **commitment schemes** and **zero-knowledge proofs** to break the link between deposits and withdrawals:

1. **Deposit**: When users deposit funds, they generate a secret commitment that represents their deposit without revealing the amount or their identity.

2. **Merkle Tree**: All commitments are stored in a binary Merkle tree, creating a cryptographic structure that allows proving membership without revealing which specific commitment belongs to whom.

3. **Withdrawal**: To withdraw funds, users generate a zero-knowledge proof that demonstrates:
   - They know the secret to a valid commitment in the tree
   - They haven't already spent this commitment (nullifier mechanism)
   - The withdrawal amount is valid

4. **Privacy**: Since the proof doesn't reveal which commitment is being spent, withdrawals are unlinkable to deposits, providing transaction privacy.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (latest version)
- [Node.js](https://nodejs.org) (v18 or higher)

### Running the Web Application Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd privacy_pool
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   bun install
   
   # Install web-app dependencies
   cd web-app
   bun install
   ```

3. **Start the development server:**
   ```bash
   # From the web-app directory
   bun run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` to access the Privacy Pool interface.

### Using the CLI Scripts

From the root directory, you can use the following commands:

```bash
# Initialize the system
bun run init

# Make a deposit
bun run deposit

# Make a withdrawal
bun run withdraw

# Generate a proof
bun run gen-proof

# Get latest note information
bun run get-latest-note
```

## Project Components

### Core Circuit (`src/main.nr`)
The Noir circuit that handles the zero-knowledge proof generation and verification:
- **Hash Function**: Uses SHA-256 compression for creating commitments
- **Merkle Proof Verification**: Validates that a commitment exists in the tree
- **Nullifier System**: Prevents double-spending of commitments

### CLI Scripts (`scripts/`)
Command-line tools for interacting with the privacy pool:

#### Core Scripts
- **`init.ts`**: Initializes the privacy pool system and storage
- **`deposit.ts`**: Handles deposit operations and commitment generation
- **`withdraw.ts`**: Processes withdrawal requests with proof generation
- **`gen_proof.ts`**: Generates zero-knowledge proofs for withdrawals
- **`get_latest_note.ts`**: Retrieves the user's current note information
- **`gen_input.ts`**: Generates input data for proof generation

#### Library Components (`scripts/lib/`)
- **`constants.ts`**: System configuration (tree depth, zero values, etc.)
- **`storage.ts`**: Persistent storage management for notes and tree state
- **`index.ts`**: Utility functions and common operations
- **`types.ts`**: TypeScript type definitions for notes and commitments

### Web Application (`web-app/`)
A React-based user interface for interacting with the privacy pool:

#### Frontend Components
- **`BankingInterface.tsx`**: Main interface for deposits, withdrawals, and balance management
- **`ui/`**: Reusable UI components (buttons, cards, inputs, etc.)
- **`pages/`**: Application pages and routing

#### Frontend Libraries
- **`storage.ts`**: Browser-side storage management
- **`types.ts`**: Frontend type definitions
- **`utils.ts`**: Utility functions including proof generation
- **`constants.ts`**: Frontend configuration constants

### Configuration Files
- **`Nargo.toml`**: Noir project configuration and dependencies
- **`package.json`**: Node.js dependencies and scripts
- **`Prover.toml`**: Proof generation parameters and test data

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App UI    │    │   CLI Scripts   │    │  Noir Circuit   │
│                 │    │                 │    │                 │
│ • Deposits      │    │ • init.ts       │    │ • Commitment    │
│ • Withdrawals   │    │ • deposit.ts    │    │ • Merkle Proof  │
│ • Balance       │    │ • withdraw.ts   │    │ • Nullifiers    │
│ • History       │    │ • gen_proof.ts  │    │ • ZK Proofs     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Local Storage  │
                    │                 │
                    │ • Notes         │
                    │ • Tree State    │
                    │ • Balances      │
                    │ • Commitments   │
                    └─────────────────┘
```

## Key Features

- **Privacy-Preserving**: Transactions are unlinkable through zero-knowledge proofs
- **Commitment Scheme**: Deposits are represented as cryptographic commitments
- **Merkle Tree**: Efficient membership proofs for large commitment sets
- **Nullifier System**: Prevents double-spending of commitments
- **Dual Interface**: Both CLI and web-based interfaces available
- **Partial Withdrawals**: Support for withdrawing portions of deposited amounts
- **Real-time UI**: Live updates for balances and transaction history

## Technology Stack

- **Noir**: Zero-knowledge proof system for privacy-preserving computations
- **TypeScript**: Type-safe development environment
- **React**: Frontend user interface framework
- **Bun**: Fast JavaScript runtime and package manager
- **Tailwind CSS**: Utility-first CSS framework
- **Poseidon**: Cryptographic hash function optimized for ZK circuits
- **BB.js**: Aztec's proving system for generating proofs

## Security Considerations

- **Commitment Uniqueness**: Each deposit generates a unique commitment
- **Nullifier Protection**: Prevents double-spending through nullifier tracking
- **Merkle Tree Integrity**: Ensures only valid commitments can be withdrawn
- **Zero-Knowledge**: Proofs reveal no information about the prover's identity
- **Storage Validation**: Automatic validation of stored data consistency

## Development Status

This is a demonstration project (v0.1) showcasing privacy pool concepts using Noir. The system maintains separate account and pool balances with a retro terminal-style interface for an engaging user experience.

## ⚠️ Important Notice

**This code is experimental and unaudited. It is intended for educational and research purposes only. Do not use this code in production environments or with real funds. The implementation may contain bugs, security vulnerabilities, or other issues that could result in loss of funds or privacy breaches.**

---

*Privacy Pool - Secure, Private, Decentralized*
