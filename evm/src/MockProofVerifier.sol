// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IProofVerifier.sol";

/**
 * @title MockProofVerifier
 * @dev Mock implementation of proof verification for testing and development
 * In production, this would be replaced with actual zero-knowledge proof verification
 */
contract MockProofVerifier is IProofVerifier {
    /// @dev Flag to control whether proofs should be accepted or rejected
    bool public acceptAllProofs = true;
    
    /// @dev Mapping to store specific proof results for testing
    mapping(bytes32 => bool) public proofResults;
    
    /**
     * @dev Sets whether all proofs should be accepted
     * @param _acceptAll True to accept all proofs, false to reject all
     */
    function setAcceptAllProofs(bool _acceptAll) external {
        acceptAllProofs = _acceptAll;
    }
    
    /**
     * @dev Sets a specific result for a proof
     * @param proofHash Hash of the proof
     * @param result The result to return for this proof
     */
    function setProofResult(bytes32 proofHash, bool result) external {
        proofResults[proofHash] = result;
    }
    
    /**
     * @dev Verifies a withdrawal proof (mock implementation)
     * @param proof The proof bytes
     * @return True if the proof is valid according to mock logic
     */
    function verifyWithdrawalProof(
        bytes calldata proof
    ) external view override returns (bool) {
        // For this version, we extract public inputs from the proof
        // and use the verifyAndExtractWithdrawalProof function
        (bool isValid, ) = this.verifyAndExtractWithdrawalProof(proof);
        return isValid;
    }
    
    /**
     * @dev Verifies a withdrawal proof and extracts public inputs (mock implementation)
     * @param proof The proof bytes containing encoded public inputs
     * @return isValid True if the proof is valid
     * @return publicInputs Array of extracted public inputs
     */
    function verifyAndExtractWithdrawalProof(
        bytes calldata proof
    ) external view override returns (bool isValid, uint256[] memory publicInputs) {
        // For mock implementation, we expect proof to contain:
        // - First 32 bytes: actual proof data (ignored in mock)
        // - Remaining bytes: ABI-encoded public inputs array
        
        require(proof.length > 32, "Proof too short");
        
        // Extract the public inputs from the proof
        bytes memory publicInputsData = proof[32:];
        publicInputs = abi.decode(publicInputsData, (uint256[]));
        
        // Validate the extracted public inputs
        require(publicInputs.length == 25, "Invalid public inputs length");
        
        uint256 withdrawAmount = publicInputs[0];
        require(withdrawAmount > 0, "Withdraw amount must be positive");
        
        // Check for specific proof result
        bytes32 proofHash = keccak256(proof);
        if (proofResults[proofHash] != false) {
            return (proofResults[proofHash], publicInputs);
        }
        
        // Default behavior based on acceptAllProofs flag
        return (acceptAllProofs, publicInputs);
    }

    /**
     * @dev Simulates proof verification with custom logic for testing
     * @param proof The proof bytes
     * @param publicInputs Array of public inputs
     * @param customResult The result to return
     * @return The custom result
     */
    function simulateVerification(
        bytes calldata proof,
        uint256[] calldata publicInputs,
        bool customResult
    ) external pure returns (bool) {
        // Prevent unused parameter warnings
        proof;
        publicInputs;
        
        return customResult;
    }
} 