// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./SHA256Lib.sol";

/**
 * @title MerkleTreeLib
 * @dev Library for Merkle tree operations with historical root tracking
 */
library MerkleTreeLib {
    using SHA256Lib for uint256;

    // Constants for history tracking
    uint256 constant HISTORY_SIZE = 100;

    struct MerkleTree {
        uint256 depth;
        uint256 zeroValue;
        uint256 leafCount;
        mapping(uint256 => uint256) leaves;
        mapping(uint256 => bool) leafExists;
        
        // History tracking
        uint256[HISTORY_SIZE] rootHistory;
        uint256 currentHistoryIndex;
        mapping(uint256 => bool) isValidHistoricalRoot;
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
        tree.currentHistoryIndex = 0;
        
        // Initialize root history with initial root (empty tree root)
        uint256 initialRoot = calculateEmptyTreeRoot(_zeroValue, _depth);
        tree.rootHistory[0] = initialRoot;
        tree.isValidHistoricalRoot[initialRoot] = true;
    }

    /**
     * @dev Calculates the root of an empty tree
     * @param zeroValue The zero value for empty nodes
     * @param depth The depth of the tree
     * @return The root hash of an empty tree
     */
    function calculateEmptyTreeRoot(uint256 zeroValue, uint256 depth) internal pure returns (uint256) {
        uint256 currentHash = zeroValue;
        for (uint256 i = 0; i < depth; i++) {
            currentHash = SHA256Lib.sha256Hash(currentHash, currentHash);
        }
        return currentHash;
    }

    /**
     * @dev Updates the root history when a new root is calculated
     * @param tree The tree storage struct
     * @param newRoot The new root to add to history
     */
    function updateRootHistory(MerkleTree storage tree, uint256 newRoot) internal {
        // Move to next history slot
        tree.currentHistoryIndex = (tree.currentHistoryIndex + 1) % HISTORY_SIZE;
        
        // Remove old root from valid mapping if it exists
        uint256 oldRoot = tree.rootHistory[tree.currentHistoryIndex];
        if (oldRoot != 0) {
            tree.isValidHistoricalRoot[oldRoot] = false;
        }
        
        // Add new root to history
        tree.rootHistory[tree.currentHistoryIndex] = newRoot;
        tree.isValidHistoricalRoot[newRoot] = true;
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

        // Calculate the new root after insertion
        uint256 newRoot = calculateCurrentRoot(tree);
        
        // Update root history with new root
        updateRootHistory(tree, newRoot);
    }

    /**
     * @dev Gets the current root of the Merkle tree
     * @param tree The tree storage struct
     * @return The root hash
     */
    function getRoot(MerkleTree storage tree) internal view returns (uint256) {
        if (tree.leafCount == 0) {
            return calculateEmptyTreeRoot(tree.zeroValue, tree.depth);
        }
        
        // Calculate the current root from the tree structure
        uint256 currentRoot = calculateCurrentRoot(tree);
        return currentRoot;
    }

    /**
     * @dev Calculates the current root from the tree structure
     * @param tree The tree storage struct
     * @return The calculated root hash
     */
    function calculateCurrentRoot(MerkleTree storage tree) internal view returns (uint256) {
        // If no leaves, return empty tree root
        if (tree.leafCount == 0) {
            return calculateEmptyTreeRoot(tree.zeroValue, tree.depth);
        }
        
        // Build the tree level by level
        uint256[] memory currentLevel = new uint256[](1 << tree.depth);
        
        // Fill the bottom level with leaves and zero values
        for (uint256 i = 0; i < (1 << tree.depth); i++) {
            if (i < tree.leafCount) {
                currentLevel[i] = tree.leaves[i];
            } else {
                currentLevel[i] = tree.zeroValue;
            }
        }
        
        // Calculate each level up to the root
        uint256 levelSize = 1 << tree.depth;
        for (uint256 level = 0; level < tree.depth; level++) {
            levelSize = levelSize / 2;
            for (uint256 i = 0; i < levelSize; i++) {
                currentLevel[i] = SHA256Lib.sha256Hash(
                    currentLevel[i * 2],
                    currentLevel[i * 2 + 1]
                );
            }
        }
        
        return currentLevel[0];
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

    /**
     * @dev Checks if a root is valid within the last 100 roots
     * @param tree The tree storage struct
     * @param root The root to check
     * @return True if the root is valid and within history, false otherwise
     */
    function isValidHistoricalRoot(MerkleTree storage tree, uint256 root) internal view returns (bool) {
        return tree.isValidHistoricalRoot[root];
    }

    /**
     * @dev Gets the current root history index
     * @param tree The tree storage struct
     * @return The current history index
     */
    function getCurrentHistoryIndex(MerkleTree storage tree) internal view returns (uint256) {
        return tree.currentHistoryIndex;
    }

    /**
     * @dev Gets a specific root from history
     * @param tree The tree storage struct
     * @param index The history index to retrieve
     * @return The root at the given history index
     */
    function getHistoricalRoot(MerkleTree storage tree, uint256 index) internal view returns (uint256) {
        require(index < HISTORY_SIZE, "History index out of bounds");
        return tree.rootHistory[index];
    }
} 