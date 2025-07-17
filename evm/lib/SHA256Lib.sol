// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SHA256Lib
 * @dev Library for SHA256 operations matching the TypeScript implementation
 */
library SHA256Lib {


    /**
     * @dev SHA256 hash function for two inputs (used in Merkle tree)
     * @param left Left input
     * @param right Right input
     * @return The hash result
     */
    function sha256Hash(uint256 left, uint256 right) internal pure returns (uint256) {
        return uint256(sha256(abi.encodePacked(left, right)));
    }

    /**
     * @dev Converts a uint256 to a bytes32 array representation (8 elements)
     * This matches the u256ToArrayBE function from TypeScript
     * @param value The uint256 value to convert
     * @return result Array of 8 uint32 values in big-endian format
     */
    function u256ToArrayBE(uint256 value) internal pure returns (uint32[8] memory result) {
        for (uint256 i = 0; i < 8; i++) {
            result[7 - i] = uint32(value & 0xffffffff);
            value >>= 32;
        }
    }

    /**
     * @dev Converts a bytes32 array (8 elements) to uint256
     * This matches the u256FromArrayBE function from TypeScript
     * @param array Array of 8 uint32 values in big-endian format
     * @return The uint256 value
     */
    function u256FromArrayBE(uint32[8] memory array) internal pure returns (uint256) {
        uint256 result = 0;
        for (uint256 i = 0; i < 8; i++) {
            result = (result << 32) | array[i];
        }
        return result;
    }
} 