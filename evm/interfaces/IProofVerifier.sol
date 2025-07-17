// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IProofVerifier
 * @dev Interface for verifying zero-knowledge proofs for privacy pool operations
 */
interface IProofVerifier {
    /**
     * @dev Verifies a withdrawal proof
     * @param proof The proof bytes
     * @return True if the proof is valid, false otherwise
     */
    function verifyWithdrawalProof(
        bytes calldata proof
    ) external view returns (bool);

    /**
     * @dev Verifies a withdrawal proof and extracts public inputs
     * @param proof The proof bytes
     * @return isValid True if the proof is valid
     * @return publicInputs Array of extracted public inputs [withdrawAmount, merkleRoot (8 elements), nullifierHash (8 elements), newCommitment (8 elements)]
     */
    function verifyAndExtractWithdrawalProof(
        bytes calldata proof
    ) external view returns (bool isValid, uint256[] memory publicInputs);
} 