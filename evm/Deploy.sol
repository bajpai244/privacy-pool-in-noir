// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./src/PrivacyPool.sol";
import "./src/MockProofVerifier.sol";
import "./test/PrivacyPoolTest.sol";

/**
 * @title Deploy
 * @dev Deployment script for the Privacy Pool system
 */
contract Deploy {
    event ContractDeployed(string name, address addr);
    
    MockProofVerifier public verifier;
    PrivacyPool public privacyPool;
    PrivacyPoolTest public testContract;
    
    /**
     * @dev Deploy the complete privacy pool system
     */
    function deploySystem() external {
        // 1. Deploy mock proof verifier
        verifier = new MockProofVerifier();
        verifier.setAcceptAllProofs(true);
        emit ContractDeployed("MockProofVerifier", address(verifier));
        
        // 2. Deploy privacy pool
        privacyPool = new PrivacyPool(IProofVerifier(address(verifier)));
        emit ContractDeployed("PrivacyPool", address(privacyPool));
        
        // 3. Deploy test contract (optional)
        testContract = new PrivacyPoolTest();
        emit ContractDeployed("PrivacyPoolTest", address(testContract));
    }
    
    /**
     * @dev Get deployed contract addresses
     */
    function getAddresses() external view returns (
        address verifierAddr,
        address poolAddr,
        address testAddr
    ) {
        return (
            address(verifier),
            address(privacyPool),
            address(testContract)
        );
    }
    
    /**
     * @dev Get privacy pool info
     */
    function getPoolInfo() external view returns (
        uint256 balance,
        uint256 leafCount,
        uint256 merkleRoot,
        uint256 totalDeposits,
        uint256 totalWithdrawals
    ) {
        require(address(privacyPool) != address(0), "Pool not deployed");
        
        return (
            address(privacyPool).balance,
            privacyPool.getLeafCount(),
            privacyPool.getMerkleRoot(),
            privacyPool.totalDeposits(),
            privacyPool.totalWithdrawals()
        );
    }
    
    /**
     * @dev Demo function - make a sample deposit
     */
    function demoDeposit() external payable {
        require(address(privacyPool) != address(0), "Pool not deployed");
        require(msg.value == 1 ether, "Must send exactly 1 ETH");
        
        // Generate sample commitment (client-side calculation)
        uint256 value = 1 ether;
        uint256 secret = 123456789;
        uint256 nullifier = 987654321;
        
        // Calculate commitment: SHA256(SHA256(value || secret) || nullifier)
        bytes32 firstHash = sha256(abi.encodePacked(value, secret));
        bytes32 commitmentHash = sha256(abi.encodePacked(firstHash, nullifier));
        uint256 commitment = uint256(commitmentHash);
        
        // Make deposit
        privacyPool.deposit{value: 1 ether}(commitment);
    }
    
    /**
     * @dev Demo function - make a sample withdrawal
     */
    function demoWithdraw() external {
        require(address(privacyPool) != address(0), "Pool not deployed");
        require(address(privacyPool).balance >= 0.5 ether, "Insufficient pool balance");
        
        // Sample withdrawal parameters (client-side calculation)
        uint256 nullifier = 987654321;
        bytes32 nullifierHashBytes = sha256(abi.encodePacked(bytes32(0), nullifier));
        uint256 nullifierHash = uint256(nullifierHashBytes);
        uint256 merkleRoot = privacyPool.getMerkleRoot();
        bytes memory proof = abi.encode("demo_proof");
        
        // Withdraw 0.5 ETH
        privacyPool.withdraw(
            proof,
            0.5 ether,
            nullifierHash,
            0, // No new commitment (full withdrawal)
            merkleRoot,
            payable(msg.sender)
        );
    }
    
    /**
     * @dev Run basic functionality test
     */
    function runBasicTest() external payable {
        require(address(testContract) != address(0), "Test contract not deployed");
        require(msg.value >= 5 ether, "Need at least 5 ETH for tests");
        
        // Run all tests
        testContract.runAllTests{value: msg.value}();
    }
}

/**
 * @title DeploymentExample
 * @dev Example showing how to use the deployment script
 */
contract DeploymentExample {
    Deploy public deployer;
    
    /**
     * @dev Complete deployment and testing flow
     */
    function fullDeploymentFlow() external payable {
        require(msg.value >= 6 ether, "Need at least 6 ETH for full flow");
        
        // Deploy the system
        deployer = new Deploy();
        deployer.deploySystem();
        
        // Get addresses
        (address verifierAddr, address poolAddr, address testAddr) = deployer.getAddresses();
        
        // Make demo deposit
        deployer.demoDeposit{value: 1 ether}();
        
        // Run tests
        deployer.runBasicTest{value: 5 ether}();
        
        // Demo withdrawal
        deployer.demoWithdraw();
        
        // Show final state
        (uint256 balance, uint256 leafCount, uint256 merkleRoot, uint256 totalDeposits, uint256 totalWithdrawals) = deployer.getPoolInfo();
        
        // The system is now deployed and tested
        // Contracts can be accessed at:
        // - Verifier: verifierAddr
        // - Pool: poolAddr  
        // - Test: testAddr
    }
} 