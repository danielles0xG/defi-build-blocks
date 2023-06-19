// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAaveStrategy {
    struct MarginShort {
        IERC20 supplyAsset;
        IERC20 borrowAsset;
        uint256 supplyAmount;
        uint256 tradeOutAmount;
        uint256 tradeDeadline;
        uint16 referralCode;
        uint16 borrowRate;
        address[] path;
    }
    event SwapEvent(address[] path, uint256 amountIn, uint256 amountOut);
    event MarginShortEvent(MarginShort);

    function swap(bytes memory _data) external returns (uint256 amountOut);

    function marginShort(bytes memory _data) external;
}
