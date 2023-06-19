// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

contract ClearingHouseMock {
    struct OpenPositionParams {
        address baseToken;
        bool isBaseToQuote;
        bool isExactInput;
        uint256 amount;
        uint256 oppositeAmountBound;
        uint256 deadline;
        uint160 sqrtPriceLimitX96;
        bytes32 referralCode;
    }

    struct ClosePositionParams {
        address baseToken;
        uint160 sqrtPriceLimitX96;
        uint256 oppositeAmountBound;
        uint256 deadline;
        bytes32 referralCode;
    }

    uint256 public positions;

    function openPosition(OpenPositionParams memory params)
        external
        returns (uint256, uint256)
    {
        positions += params.amount;
        return params.isBaseToQuote ? (1, 0) : (0, 1);
    }

    function closePosition(ClosePositionParams calldata params)
        external
        returns (uint256, uint256)
    {
        positions -= params.oppositeAmountBound;
        return (1, 0);
    }
}
