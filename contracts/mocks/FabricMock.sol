// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../BBFabric.sol";

contract FabricMock is BBFabric {
    constructor(
        uint16 _nativeChainId,
        address _nativeLZEndpoint,
        address _actionPool,
        uint16 _actionPoolNativeId,
        uint16 _registryChainId,
        address _registryAddress
    )
        BBFabric(
            _nativeChainId,
            _nativeLZEndpoint,
            _actionPool,
            _actionPoolNativeId,
            _registryChainId,
            _registryAddress
        )
    {}

    function initNewBBACMock(
        uint256 strategyId,
        address implementation,
        bytes memory constructorData,
        uint16 fabricID,
        bytes memory bbFabric
    ) external payable {
        bytes4 FUNC_SELECTOR = bytes4(
            keccak256("initNewProxy(uint256,address,bytes)")
        );
        bytes memory actionData = abi.encodeWithSelector(
            FUNC_SELECTOR,
            strategyId,
            implementation,
            constructorData
        );
        _performActionLzSend(fabricID, bbFabric, actionData, msg.value);
    }

    function upgradeBBACMock(
        uint256 strategyId,
        address proxy,
        address newImplementation,
        uint16 fabricID,
        bytes memory bbFabric
    ) external payable {
        bytes4 FUNC_SELECTOR = bytes4(
            keccak256("upgradeProxyImplementation(uint256,address,address)")
        );
        bytes memory actionData = abi.encodeWithSelector(
            FUNC_SELECTOR,
            strategyId,
            proxy,
            newImplementation
        );
        _performActionLzSend(fabricID, bbFabric, actionData, msg.value);
    }

    function _performActionLzSend(
        uint16 receiverId,
        bytes memory receiverAddress,
        bytes memory payloadToEndpoint,
        uint256 nativeFee
    ) private {
        _nonblockingLzReceive(
            receiverId,
            receiverAddress,
            1,
            payloadToEndpoint
        );
    }
}
