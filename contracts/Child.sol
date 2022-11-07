// licence: MIT
//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

interface IUniswapRouter is ISwapRouter {
    function refundETH() external payable;
}

contract Child is AutomationCompatibleInterface, Initializable {
    IUniswapRouter public uniswapRouter;
    address public immutable contractOwner;
    address public _tenantOwner;
    uint256 public interval;
    uint256 public lastTimeStamp;

    uint256 public minBalance;
    uint256 public topUpAmount;
    address public LINK;
    address public WETH;

    error Unauthorized();
    error AlreadyInitialized();

    modifier isTenantOwner() {
        if (msg.sender != _tenantOwner) {
            revert Unauthorized();
        }
        _;
    }

    modifier canInitialize(address _tenant) {
        if (_tenantOwner != address(0)) {
            revert AlreadyInitialized();
        }
        _;
    }

    constructor(address _owner) {
        contractOwner = _owner;
    }

    function initialize(
        address _tenant,
        uint256 _interval,
        uint256 _minBalance,
        uint256 _topUpAmount,
        address _dex,
        address _LINK,
        address _WETH
    ) external initializer canInitialize(_tenant) {
        _tenantOwner = _tenant;
        interval = _interval;
        minBalance = _minBalance;
        topUpAmount = _topUpAmount;
        lastTimeStamp = block.timestamp;
        LINK = _LINK;
        WETH = _WETH;
        uniswapRouter = IUniswapRouter(_dex);
    }

    function getName() external pure returns (string memory) {
        return "Child";
    }

    function setMinBalance(uint256 _minBalance) external isTenantOwner {
        minBalance = _minBalance;
    }

    function setTopUpAmount(uint256 _topUpAmount) external isTenantOwner {
        topUpAmount = _topUpAmount;
    }

    function setLink(address _link) external isTenantOwner {
        LINK = _link;
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            convertEthToLink();
        }
    }

    function convertEthToLink() internal {
        require(address(this).balance > 0, "Contract has no ETH");

        uint256 deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!
        address tokenIn = WETH;
        address tokenOut = LINK;
        uint24 fee = 3000;
        address recipient = address(this);
        uint256 amountIn = msg.value;
        uint256 amountOutMinimum = 1;
        uint160 sqrtPriceLimitX96 = 0;

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams(
                tokenIn,
                tokenOut,
                fee,
                recipient,
                deadline,
                amountIn,
                amountOutMinimum,
                sqrtPriceLimitX96
            );

        uniswapRouter.exactInputSingle{value: msg.value}(params);
        uniswapRouter.refundETH();
    }

    // receive() external payable {}
}
