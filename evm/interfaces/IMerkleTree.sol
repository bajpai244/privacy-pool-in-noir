// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMerkleTree
 * @dev Interface for Merkle tree operations used in privacy pool
 */
interface IMerkleTree {
    /**
     * @dev Inserts a leaf into the Merkle tree
     * @param leaf The leaf value to insert
     */
    function insert(uint256 leaf) external;

    /**
     * @dev Gets the current root of the Merkle tree
     * @return The root hash
     */
    function getRoot() external view returns (uint256);

    /**
     * @dev Checks if a leaf exists in the tree
     * @param leaf The leaf to check
     * @return True if the leaf exists, false otherwise
     */
    function leafExists(uint256 leaf) external view returns (bool);

    /**
     * @dev Gets the depth of the tree
     * @return The depth of the tree
     */
    function getDepth() external view returns (uint256);

    /**
     * @dev Gets the number of leaves in the tree
     * @return The number of leaves
     */
    function getLeafCount() external view returns (uint256);

    /**
     * @dev Verifies a Merkle proof
     * @param leaf The leaf to verify
     * @param proof Array of sibling hashes
     * @param pathIndices Array of path indices (0 for left, 1 for right)
     * @param root The root to verify against
     * @return True if the proof is valid, false otherwise
     */
    function verifyProof(
        uint256 leaf,
        uint256[] calldata proof,
        uint256[] calldata pathIndices,
        uint256 root
    ) external pure returns (bool);
} 