// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

interface IExchange {
    /// @notice Get the square root of the market twap price with the given time interval
    /// @dev The return value is a X96 number
    /// @param baseToken Address of the base token
    /// @param twapInterval The time interval in seconds
    /// @return sqrtMarkTwapX96 The square root of the market twap price
    function getSqrtMarkTwapX96(address baseToken, uint32 twapInterval)
        external
        view
        returns (uint160 sqrtMarkTwapX96);
}
