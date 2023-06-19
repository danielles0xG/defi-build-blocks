// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../buildingBlocks/BaseBuildingBlock.sol";

contract BBMock is BaseBuildingBlock {
    uint256 public borrowBalance;
    uint256 public openPosit;
    address public lastBaseAsset;

    uint256 private tvlMock;

    function initialize(bytes memory _data) public initializer {
        (address endpoint, address actionPool, uint16 actionPoolNativeId) = abi
            .decode(_data, (address, address, uint16));
        __Ownable_init();
        __LzAppUpgradeable_init(endpoint);
        trustedRemoteLookup[actionPoolNativeId] = abi.encodePacked(
            actionPool,
            address(this)
        );
        _actionPool = actionPool;
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

    function setTvlMock(uint256 _tvl) public {
        tvlMock = _tvl;
    }

    function getTvlMock() public view returns (uint256) {
        return tvlMock;
    }

    uint256[50] private __gap;
}
