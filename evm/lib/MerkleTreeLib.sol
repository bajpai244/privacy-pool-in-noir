// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SHA256Lib.sol";

/**
 * @title MerkleTreeLib
 * @dev Library for Merkle tree operations matching the IMT functionality
 */
library MerkleTreeLib {
    using SHA256Lib for uint256;

    struct MerkleTree {
        uint256 depth;
        uint256 zeroValue;
        uint256 leafCount;
        mapping(uint256 => uint256) leaves;
        mapping(uint256 => mapping(uint256 => uint256)) nodes;
        mapping(uint256 => bool) leafExists;
    }

    /**
     * @dev Initializes a new Merkle tree
     * @param tree The tree storage struct
     * @param _depth The depth of the tree
     * @param _zeroValue The zero value used for empty nodes
     */
    function initialize(
        MerkleTree storage tree,
        uint256 _depth,
        uint256 _zeroValue
    ) internal {
        tree.depth = _depth;
        tree.zeroValue = _zeroValue;
        tree.leafCount = 0;
        
        // Initialize zero values for each level
        uint256 currentZero = _zeroValue;
        for (uint256 i = 0; i < _depth; i++) {
            tree.nodes[i][0] = currentZero;
            currentZero = SHA256Lib.sha256Hash(currentZero, currentZero);
        }
    }

    /**
     * @dev Inserts a leaf into the Merkle tree
     * @param tree The tree storage struct
     * @param leaf The leaf value to insert
     */
    function insert(MerkleTree storage tree, uint256 leaf) internal {
        require(tree.leafCount < (1 << tree.depth), "Tree is full");
        require(!tree.leafExists[leaf], "Leaf already exists");

        uint256 index = tree.leafCount;
        tree.leaves[index] = leaf;
        tree.leafExists[leaf] = true;
        tree.leafCount++;

        // Update the tree from bottom to top
        uint256 currentIndex = index;
        uint256 currentValue = leaf;

        for (uint256 level = 0; level < tree.depth; level++) {
            tree.nodes[level][currentIndex] = currentValue;
            
            // Calculate parent
            uint256 parentIndex = currentIndex / 2;
            uint256 siblingIndex = currentIndex % 2 == 0 ? currentIndex + 1 : currentIndex - 1;
            
            uint256 siblingValue;
            if (siblingIndex < (1 << (tree.depth - level))) {
                siblingValue = tree.nodes[level][siblingIndex];
            } else {
                siblingValue = tree.zeroValue;
            }

            if (currentIndex % 2 == 0) {
                currentValue = SHA256Lib.sha256Hash(currentValue, siblingValue);
            } else {
                currentValue = SHA256Lib.sha256Hash(siblingValue, currentValue);
            }

            currentIndex = parentIndex;
        }
    }

    /**
     * @dev Gets the current root of the Merkle tree
     * @param tree The tree storage struct
     * @return The root hash
     */
    function getRoot(MerkleTree storage tree) internal view returns (uint256) {
        if (tree.leafCount == 0) {
            return tree.zeroValue;
        }
        
        // Build the root from the current leaves
        uint256 currentLevel = tree.depth - 1;
        uint256 maxIndex = (tree.leafCount - 1) / (1 << currentLevel);
        
        return tree.nodes[currentLevel][maxIndex];
    }

    /**
     * @dev Checks if a leaf exists in the tree
     * @param tree The tree storage struct
     * @param leaf The leaf to check
     * @return True if the leaf exists, false otherwise
     */
    function hasLeaf(MerkleTree storage tree, uint256 leaf) internal view returns (bool) {
        return tree.leafExists[leaf];
    }

    /**
     * @dev Gets the depth of the tree
     * @param tree The tree storage struct
     * @return The depth of the tree
     */
    function getDepth(MerkleTree storage tree) internal view returns (uint256) {
        return tree.depth;
    }

    /**
     * @dev Gets the number of leaves in the tree
     * @param tree The tree storage struct
     * @return The number of leaves
     */
    function getLeafCount(MerkleTree storage tree) internal view returns (uint256) {
        return tree.leafCount;
    }

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
        uint256[] memory proof,
        uint256[] memory pathIndices,
        uint256 root
    ) internal pure returns (bool) {
        require(proof.length == pathIndices.length, "Proof and path indices length mismatch");

        uint256 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            uint256 proofElement = proof[i];
            
            if (pathIndices[i] == 0) {
                // Current node is left child
                computedHash = SHA256Lib.sha256Hash(computedHash, proofElement);
            } else {
                // Current node is right child
                computedHash = SHA256Lib.sha256Hash(proofElement, computedHash);
            }
        }

        return computedHash == root;
    }
} 