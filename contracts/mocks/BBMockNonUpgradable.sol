// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../buildingBlocks/BaseBuildingBlockNonUpgradable.sol";

contract BBMockNonUpgradable is BaseBuildingBlockNonUpgradable {
    uint256 public borrowBalance;
    uint256 public openPosit;
    address public lastBaseAsset;

    constructor(bytes memory _data) {
        (address endpoint, address actionPool, uint16 actionPoolNativeId) = abi
            .decode(_data, (address, address, uint16));
        trustedRemoteLookup[actionPoolNativeId] = abi.encodePacked(
            actionPool,
            address(this)
        );
        _actionPool = actionPool;
        lzEndpoint = ILayerZeroEndpoint(endpoint);
    }

    function borrow(bytes memory _data) public {
        (address p0, uint256 p1) = abi.decode(_data, (address, uint256));
        lastBaseAsset = p0;
        borrowBalance += p1;
    }

    function repay(bytes memory _data) public {
        (address p0, uint256 p1) = abi.decode(_data, (address, uint256));
        lastBaseAsset = p0;
        borrowBalance -= p1;
    }

    function openPosition(bytes memory _data) public {
        (address p0, uint256 p1) = abi.decode(_data, (address, uint256));

        lastBaseAsset = p0;
        openPosit += p1;
    }
}
