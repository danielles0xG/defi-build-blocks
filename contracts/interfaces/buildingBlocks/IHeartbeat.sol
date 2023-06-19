// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IHeartbeat {
    event HeartbeatCompleted(uint256 newHeight);

    function setActionPool(address newActionPool) external;

    function pulse(uint256 height) external;
}
