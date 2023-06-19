// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../DcRouter.sol";
import "hardhat/console.sol";

contract DcRouterMock is DcRouter {
    constructor(
        address deCommasTreasurer,
        uint16 nativeChainId,
        address nativeLZEndpoint,
        address currentUSDC,
        address actionPool,
        uint16 actionPoolNativeId
    )
        DcRouter(
            deCommasTreasurer,
            nativeChainId,
            nativeLZEndpoint,
            currentUSDC,
            actionPool,
            actionPoolNativeId
        )
    {}

    function setStableMock(
        uint256 strategyId,
        address newStableToken,
        uint16 receiverId,
        bytes memory receiverAddress
    ) external payable {
        bytes4 FUNC_SELECTOR = bytes4(keccak256("setStable(address)"));
        bytes memory actionData = abi.encodeWithSelector(
            FUNC_SELECTOR,
            newStableToken
        );
        _performActionLzSend(
            strategyId,
            receiverId,
            receiverAddress,
            actionData
        );
    }

    function approveWithdrawMock(
        uint256 withdrawalId,
        uint256 stableDeTokenPrice,
        uint256 strategyId,
        uint16 receiverId,
        bytes memory receiverAddress
    ) external payable {
        bytes4 funcSelector = bytes4(
            keccak256("approveWithdraw(uint256,uint256,uint256)")
        );
        bytes memory actionData = abi.encodeWithSelector(
            funcSelector,
            stableDeTokenPrice,
            strategyId,
            withdrawalId
        );
        _performActionLzSend(
            strategyId,
            receiverId,
            receiverAddress,
            actionData
        );
    }

    function cancelWithdrawMock(
        uint256 _withdrawalId,
        uint256 _strategyId,
        uint16 _receiverId,
        bytes memory _receiverAddress
    ) external payable {
        bytes4 funcSelector = bytes4(
            keccak256("cancelWithdraw(uint256,uint256)")
        );
        bytes memory actionData = abi.encodeWithSelector(
            funcSelector,
            _withdrawalId,
            _strategyId
        );
        _performActionLzSend(
            _strategyId,
            _receiverId,
            _receiverAddress,
            actionData
        );
    }

    function _performActionLzSend(
        uint256 _strategyId,
        uint16 _receiverId,
        bytes memory _receiverAddress,
        bytes memory _payloadToEndpoint
    ) private {
        _nonblockingLzReceive(
            _receiverId,
            _receiverAddress,
            1,
            _payloadToEndpoint
        );
    }
}
