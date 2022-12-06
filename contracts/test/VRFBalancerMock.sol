//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract VRFBalancerMock {
    IUniswapV2Router02 DEX_ROUTER;
    constructor(address router) {
        DEX_ROUTER = IUniswapV2Router02(router);
    }

    function dexSwap(
        address _fromToken,
        address _toToken,
        uint256 _amount
    ) external {
        
        address[] memory path = new address[](2);
        path[0] = _fromToken;
        path[1] = _toToken;
        uint256[] memory amounts = DEX_ROUTER.swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(this),
            block.timestamp
        );

    }


}