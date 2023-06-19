// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IUniswapVault {
    function pause() external;

    function unpause() external;

    function deposit(bytes memory _data) external;

    function adjustPosition(bytes memory _data) external;

    function withdrawUSDC(bytes memory _data) external;

    function bridgeToRouterBack(bytes memory _data) external payable;

    function getReserve() external view returns (uint256);

    function getTotalUSDCValue() external view returns (uint256);

    function stringToBytes32(string memory source)
        external
        pure
        returns (bytes32 result);

    function updateSwapInfo(
        uint24 feeToPair_,
        uint160 deadlineTime_,
        uint160 sqrtPriceLimitX96toUni_
    ) external;
}
