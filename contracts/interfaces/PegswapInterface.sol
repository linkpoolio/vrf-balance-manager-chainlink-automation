// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface PegswapInterface {
    function swap(
        uint256 amount,
        address source,
        address target
    ) external;
}
