// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IProofVerifier.sol";
import "../interfaces/IMerkleTree.sol";
import "../lib/SHA256Lib.sol";
import "../lib/MerkleTreeLib.sol";

/**
 * @title PrivacyPool
 * @dev Privacy-preserving mixer contract using zero-knowledge proofs
 * Allows users to deposit ETH and withdraw anonymously
 */
contract PrivacyPool {
    using SHA256Lib for uint256;
    using MerkleTreeLib for MerkleTreeLib.MerkleTree;

    // Events
    event Deposit(uint256 indexed commitment, uint256 amount, uint256 leafIndex);
    event Withdrawal(
        uint256 indexed nullifierHash,
        uint256 amount,
        address to,
        uint256 newCommitment
    );

    // Constants from TypeScript scripts
    uint256 public constant TREE_DEPTH = 20;
    uint256 public constant TREE_ZERO_VALUE = 0;
    uint256 public constant DENOMINATION = 1 ether; // Fixed denomination for simplicity

    // State variables
    IProofVerifier public immutable proofVerifier;
    MerkleTreeLib.MerkleTree internal merkleTree;
    mapping(uint256 => bool) public nullifierHashExists;
    
    // Statistics
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;

    /**
     * @dev Constructor
     * @param _proofVerifier Address of the proof verifier contract
     */
    constructor(IProofVerifier _proofVerifier) {
        proofVerifier = _proofVerifier;
        merkleTree.initialize(TREE_DEPTH, TREE_ZERO_VALUE);
    }

    /**
     * @dev Deposits ETH into the privacy pool
     * @param commitment The commitment hash for the deposit
     */
    function deposit(uint256 commitment) external payable {
        require(msg.value == DENOMINATION, "Must deposit exactly 1 ETH");
        require(commitment != 0, "Invalid commitment");
        require(!merkleTree.hasLeaf(commitment), "Commitment already exists");

        // Insert commitment into the Merkle tree
        merkleTree.insert(commitment);
        
        // Update statistics
        totalDeposits += msg.value;
        
        emit Deposit(commitment, msg.value, merkleTree.getLeafCount() - 1);
    }

    /**
     * @dev Withdraws ETH from the privacy pool using a zero-knowledge proof
     * @param proof The zero-knowledge proof containing all withdrawal data
     * @param to The address to send the withdrawn funds to
     */
    function withdraw(
        bytes calldata proof,
        address payable to
    ) external {
        // Basic checks
        require(to != address(0), "Invalid recipient address");
        
        // Verify proof and extract public inputs
        (bool proofValid, uint256[] memory publicInputs) = proofVerifier.verifyAndExtractWithdrawalProof(proof);
        require(proofValid, "Invalid proof");
        
        // Extract components from public inputs
        uint256 withdrawAmount = publicInputs[0];
        
        // Reconstruct merkleRoot from array format (elements 1-8)
        uint32[8] memory merkleRootArray;
        for (uint256 i = 0; i < 8; i++) {
            merkleRootArray[i] = uint32(publicInputs[1 + i]);
        }
        uint256 merkleRoot = SHA256Lib.u256FromArrayBE(merkleRootArray);
        
        // Reconstruct nullifierHash from array format (elements 9-16)
        uint32[8] memory nullifierHashArray;
        for (uint256 i = 0; i < 8; i++) {
            nullifierHashArray[i] = uint32(publicInputs[9 + i]);
        }
        uint256 nullifierHash = SHA256Lib.u256FromArrayBE(nullifierHashArray);
        
        // Reconstruct newCommitment from array format (elements 17-24)
        uint32[8] memory newCommitmentArray;
        for (uint256 i = 0; i < 8; i++) {
            newCommitmentArray[i] = uint32(publicInputs[17 + i]);
        }
        uint256 newCommitment = SHA256Lib.u256FromArrayBE(newCommitmentArray);
        
        // Validate extracted values
        require(withdrawAmount > 0, "Withdraw amount must be positive");
        require(withdrawAmount <= DENOMINATION, "Cannot withdraw more than denomination");
        require(address(this).balance >= withdrawAmount, "Insufficient pool balance");
        
        // Check nullifier hasn't been used
        require(!nullifierHashExists[nullifierHash], "Nullifier already used");
        
        // Check merkle root matches current tree
        require(merkleRoot == merkleTree.getRoot(), "Invalid merkle root");
        
        // Mark nullifier as used
        nullifierHashExists[nullifierHash] = true;

        // If partial withdrawal, add new commitment to tree
        if (newCommitment != 0) {
            require(!merkleTree.hasLeaf(newCommitment), "New commitment already exists");
            merkleTree.insert(newCommitment);
        }

        // Transfer funds to recipient
        totalWithdrawals += withdrawAmount;
        to.transfer(withdrawAmount);

        emit Withdrawal(nullifierHash, withdrawAmount, to, newCommitment);
    }

    /**
     * @dev Gets the current Merkle tree root
     * @return The current root hash
     */
    function getMerkleRoot() external view returns (uint256) {
        return merkleTree.getRoot();
    }

    /**
     * @dev Gets the number of leaves in the Merkle tree
     * @return The number of leaves
     */
    function getLeafCount() external view returns (uint256) {
        return merkleTree.getLeafCount();
    }

    /**
     * @dev Gets the depth of the Merkle tree
     * @return The depth of the tree
     */
    function getTreeDepth() external view returns (uint256) {
        return merkleTree.getDepth();
    }

    /**
     * @dev Checks if a commitment exists in the tree
     * @param commitment The commitment to check
     * @return True if the commitment exists, false otherwise
     */
    function commitmentExists(uint256 commitment) external view returns (bool) {
        return merkleTree.hasLeaf(commitment);
    }

    /**
     * @dev Verifies a Merkle proof against the current tree
     * @param leaf The leaf to verify
     * @param proof Array of sibling hashes
     * @param pathIndices Array of path indices
     * @return True if the proof is valid, false otherwise
     */
    function verifyMerkleProof(
        uint256 leaf,
        uint256[] calldata proof,
        uint256[] calldata pathIndices
    ) external view returns (bool) {
        return MerkleTreeLib.verifyProof(leaf, proof, pathIndices, merkleTree.getRoot());
    }

    /**
     * @dev Emergency function to pause deposits (only for testing)
     * In production, this would be controlled by governance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }


} 