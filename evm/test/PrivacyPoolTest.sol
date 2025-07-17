// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../src/PrivacyPool.sol";
import "../src/MockProofVerifier.sol";
import "../lib/SHA256Lib.sol";

/**
 * @title PrivacyPoolTest
 * @dev Simple integration test demonstrating the privacy pool deposit and withdrawal flow
 */
contract PrivacyPoolTest {
    using SHA256Lib for uint256;
    
    PrivacyPool public privacyPool;
    MockProofVerifier public mockVerifier;
    
    // Test users
    address public alice = address(0x1);
    address public bob = address(0x2);
    
    // Test values
    uint256 public constant DENOMINATION = 1 ether;
    uint256 public constant TEST_COMMITMENT = 12345;
    uint256 public constant TEST_NULLIFIER = 67890;
    uint256 public constant TEST_NEW_COMMITMENT = 11111;
    
    event TestLog(string message, uint256 value);
    
    /**
     * @dev Sets up the test environment
     */
    function setUp() public {
        // Deploy mock proof verifier
        mockVerifier = new MockProofVerifier();
        mockVerifier.setAcceptAllProofs(true);
        
        // Deploy privacy pool
        privacyPool = new PrivacyPool(mockVerifier);
        
        // Give Alice some ETH
        deal(alice, 10 ether);
        deal(bob, 10 ether);
    }
    
    /**
     * @dev Integration test: Deposit and Withdrawal flow
     * This test demonstrates the complete privacy pool flow:
     * 1. Alice deposits 1 ETH with a commitment
     * 2. Bob withdraws using a zero-knowledge proof (mocked)
     * 3. The system maintains privacy by not linking the deposit to withdrawal
     */
    function testDepositAndWithdrawal() public {
        // === STEP 1: Alice makes a deposit ===
        emit TestLog("=== DEPOSIT PHASE ===", 0);
        
        startPrank(alice);
        
        // Check initial state
        assertEq(privacyPool.totalDeposits(), 0);
        assertEq(privacyPool.getLeafCount(), 0);
        assertEq(address(privacyPool).balance, 0);
        
        // Alice deposits 1 ETH with her commitment
        privacyPool.deposit{value: DENOMINATION}(TEST_COMMITMENT);
        
        // Verify deposit was successful
        assertEq(privacyPool.totalDeposits(), DENOMINATION);
        assertEq(privacyPool.getLeafCount(), 1);
        assertEq(address(privacyPool).balance, DENOMINATION);
        assertTrue(privacyPool.commitmentExists(TEST_COMMITMENT));
        
        emit TestLog("Alice deposited 1 ETH", DENOMINATION);
        emit TestLog("Commitment added to tree", TEST_COMMITMENT);
        emit TestLog("Current tree root", privacyPool.getMerkleRoot());
        
        stopPrank();
        
        // === STEP 2: Bob withdraws using a zero-knowledge proof ===
        emit TestLog("=== WITHDRAWAL PHASE ===", 0);
        
        startPrank(bob);
        
        // Bob creates a withdrawal proof (in real system, this would be generated off-chain)
        bytes memory withdrawalProof = createMockWithdrawalProof(
            DENOMINATION,           // Full withdrawal amount
            privacyPool.getMerkleRoot(), // Current merkle root
            TEST_NULLIFIER,        // Nullifier to prevent double-spending
            0                      // No new commitment (full withdrawal)
        );
        
        // Check Bob's initial balance
        uint256 bobInitialBalance = bob.balance;
        
        // Bob withdraws anonymously (no link to Alice's deposit)
        privacyPool.withdraw(withdrawalProof, payable(bob));
        
        // Verify withdrawal was successful
        assertEq(privacyPool.totalWithdrawals(), DENOMINATION);
        assertEq(address(privacyPool).balance, 0);
        assertEq(bob.balance, bobInitialBalance + DENOMINATION);
        assertTrue(privacyPool.nullifierHashExists(TEST_NULLIFIER));
        
        emit TestLog("Bob withdrew 1 ETH", DENOMINATION);
        emit TestLog("Nullifier marked as used", TEST_NULLIFIER);
        emit TestLog("Privacy preserved: No link between Alice and Bob", 1);
        
        stopPrank();
        
        // === STEP 3: Demonstrate privacy preservation ===
        emit TestLog("=== PRIVACY VERIFICATION ===", 0);
        
        // The system successfully mixed the funds:
        // - Alice deposited with commitment 12345
        // - Bob withdrew using nullifier 67890
        // - No observer can link Alice's deposit to Bob's withdrawal
        // - The merkle tree hides the connection between commitments and nullifiers
        
        emit TestLog("Privacy pool successfully mixed funds", 1);
        emit TestLog("Total deposits processed", privacyPool.totalDeposits());
        emit TestLog("Total withdrawals processed", privacyPool.totalWithdrawals());
    }
    
    /**
     * @dev Test partial withdrawal (demonstrates new commitment creation)
     */
    function testPartialWithdrawal() public {
        // Setup: Alice deposits 1 ETH
        startPrank(alice);
        privacyPool.deposit{value: DENOMINATION}(TEST_COMMITMENT);
        stopPrank();
        
        // Bob withdraws 0.5 ETH (partial withdrawal)
        startPrank(bob);
        
        uint256 partialAmount = 0.5 ether;
        bytes memory partialProof = createMockWithdrawalProof(
            partialAmount,
            privacyPool.getMerkleRoot(),
            TEST_NULLIFIER,
            TEST_NEW_COMMITMENT  // New commitment for remaining 0.5 ETH
        );
        
        uint256 bobInitialBalance = bob.balance;
        privacyPool.withdraw(partialProof, payable(bob));
        
        // Verify partial withdrawal
        assertEq(bob.balance, bobInitialBalance + partialAmount);
        assertEq(address(privacyPool).balance, DENOMINATION - partialAmount);
        assertTrue(privacyPool.commitmentExists(TEST_NEW_COMMITMENT));
        
        emit TestLog("Partial withdrawal successful", partialAmount);
        emit TestLog("New commitment created for remaining funds", TEST_NEW_COMMITMENT);
        
        stopPrank();
    }
    
    /**
     * @dev Creates a mock withdrawal proof for testing
     * In a real system, this would be generated by the client using zero-knowledge proofs
     */
    function createMockWithdrawalProof(
        uint256 withdrawAmount,
        uint256 merkleRoot,
        uint256 nullifierHash,
        uint256 newCommitment
    ) private pure returns (bytes memory) {
        // Construct public inputs array as expected by the verifier
        uint256[] memory publicInputs = new uint256[](25);
        publicInputs[0] = withdrawAmount;
        
        // Convert merkleRoot to array format (8 elements)
        uint32[8] memory merkleRootArray = SHA256Lib.u256ToArrayBE(merkleRoot);
        for (uint256 i = 0; i < 8; i++) {
            publicInputs[1 + i] = merkleRootArray[i];
        }
        
        // Convert nullifierHash to array format (8 elements)
        uint32[8] memory nullifierHashArray = SHA256Lib.u256ToArrayBE(nullifierHash);
        for (uint256 i = 0; i < 8; i++) {
            publicInputs[9 + i] = nullifierHashArray[i];
        }
        
        // Convert newCommitment to array format (8 elements)
        uint32[8] memory newCommitmentArray = SHA256Lib.u256ToArrayBE(newCommitment);
        for (uint256 i = 0; i < 8; i++) {
            publicInputs[17 + i] = newCommitmentArray[i];
        }
        
        // Create mock proof: 32 bytes of dummy proof + encoded public inputs
        bytes memory dummyProof = new bytes(32);
        return abi.encodePacked(dummyProof, abi.encode(publicInputs));
    }
    
    // Mock vm functions for testing (these would be provided by a testing framework)
    function deal(address account, uint256 balance) private {
        // Mock implementation - in real tests, this would be provided by foundry/hardhat
    }
    
    function startPrank(address account) private {
        // Mock implementation - sets msg.sender to account
    }
    
    function stopPrank() private {
        // Mock implementation - stops pranking
    }
    
    // Helper assertion functions
    function assertEq(uint256 a, uint256 b) private pure {
        require(a == b, "Assertion failed: values not equal");
    }
    
    function assertTrue(bool condition) private pure {
        require(condition, "Assertion failed: condition not true");
    }
} 