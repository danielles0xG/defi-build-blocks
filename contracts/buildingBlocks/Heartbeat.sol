// SPDX-License-Identifier: ISC
pragma solidity ^0.8.0;

import "./BaseBuildingBlockNonUpgradable.sol";
import "../interfaces/buildingBlocks/IHeartbeat.sol";

contract Heartbeat is BaseBuildingBlockNonUpgradable, IHeartbeat {
    uint256 public relayerBlockHeight;

    constructor(address actionPool) {
        _actionPool = actionPool;
    }

    function setActionPool(address newActionPool) external override onlyOwner {
        _actionPool = newActionPool;
    }

    function pulse(uint256 height) public override onlySelf {
        relayerBlockHeight = height;

        emit HeartbeatCompleted(height);
    }
}
