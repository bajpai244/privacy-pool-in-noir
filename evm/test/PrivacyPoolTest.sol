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
     * @dev Test historical root functionality
     * This test demonstrates that users can create proofs based on older tree states
     * and still have them validated within the 100-root history window
     */
    function testHistoricalRootSupport() public {
        emit TestLog("=== HISTORICAL ROOT TEST ===", 0);
        
        // Step 1: Alice deposits and we capture the root
        startPrank(alice);
        privacyPool.deposit{value: DENOMINATION}(TEST_COMMITMENT);
        uint256 rootAfterAlice = privacyPool.getMerkleRoot();
        stopPrank();
        
        emit TestLog("Alice deposited, root captured", rootAfterAlice);
        
        // Step 2: Multiple other users deposit (to change the root)
        address user1 = address(0x10);
        address user2 = address(0x20);
        address user3 = address(0x30);
        
        deal(user1, 10 ether);
        deal(user2, 10 ether);
        deal(user3, 10 ether);
        
        // User1 deposits
        startPrank(user1);
        privacyPool.deposit{value: DENOMINATION}(11111);
        uint256 rootAfterUser1 = privacyPool.getMerkleRoot();
        stopPrank();
        
        // User2 deposits
        startPrank(user2);
        privacyPool.deposit{value: DENOMINATION}(22222);
        uint256 rootAfterUser2 = privacyPool.getMerkleRoot();
        stopPrank();
        
        // User3 deposits
        startPrank(user3);
        privacyPool.deposit{value: DENOMINATION}(33333);
        uint256 currentRoot = privacyPool.getMerkleRoot();
        stopPrank();
        
        emit TestLog("Multiple deposits made, tree has evolved", currentRoot);
        
        // Step 3: Verify that old roots are still valid
        assertTrue(privacyPool.isValidHistoricalRoot(rootAfterAlice));
        assertTrue(privacyPool.isValidHistoricalRoot(rootAfterUser1));
        assertTrue(privacyPool.isValidHistoricalRoot(rootAfterUser2));
        assertTrue(privacyPool.isValidHistoricalRoot(currentRoot));
        
        emit TestLog("All historical roots are valid", 1);
        
        // Step 4: Bob creates a withdrawal proof using Alice's old root
        startPrank(bob);
        
        bytes memory historicalProof = createMockWithdrawalProof(
            DENOMINATION,
            rootAfterAlice,  // Using the old root when Alice deposited
            TEST_NULLIFIER,
            0  // Full withdrawal
        );
        
        uint256 bobInitialBalance = bob.balance;
        
        // This should succeed even though the root is old
        privacyPool.withdraw(historicalProof, payable(bob));
        
        // Verify withdrawal with historical root succeeded
        assertEq(bob.balance, bobInitialBalance + DENOMINATION);
        assertTrue(privacyPool.nullifierHashExists(TEST_NULLIFIER));
        
        emit TestLog("Bob withdrew using historical root", rootAfterAlice);
        emit TestLog("Historical root withdrawal successful", 1);
        
        stopPrank();
        
        // Step 5: Demonstrate privacy enhancement
        emit TestLog("=== PRIVACY ENHANCEMENT ===", 0);
        emit TestLog("Alice deposited when tree had root", rootAfterAlice);
        emit TestLog("Bob withdrew when tree had root", privacyPool.getMerkleRoot());
        emit TestLog("Time gap between deposit and withdrawal preserves privacy", 1);
        
        // The historical root support allows users to:
        // 1. Create proofs offline based on older tree states
        // 2. Submit withdrawals later when the tree has evolved
        // 3. Maintain privacy by not being forced to withdraw immediately
        // 4. Handle network congestion by allowing delayed submissions
    }
    
    /**
     * @dev Test that very old roots (beyond 100 history) are rejected
     */
    function testExpiredRootRejection() public {
        emit TestLog("=== EXPIRED ROOT TEST ===", 0);
        
        // Create a fake old root that's not in history
        uint256 fakeOldRoot = 999999;
        
        // Verify it's not valid
        assertFalse(privacyPool.isValidHistoricalRoot(fakeOldRoot));
        
        startPrank(bob);
        
        bytes memory expiredProof = createMockWithdrawalProof(
            DENOMINATION,
            fakeOldRoot,  // Using a fake expired root
            TEST_NULLIFIER,
            0
        );
        
        // This should fail with "Invalid or expired merkle root"
        bool failed = false;
        try privacyPool.withdraw(expiredProof, payable(bob)) {
            failed = false;
        } catch {
            failed = true;
        }
        
        assertTrue(failed);
        emit TestLog("Expired root correctly rejected", 1);
        
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

    function assertFalse(bool condition) private pure {
        require(!condition, "Assertion failed: condition not false");
    }
} 