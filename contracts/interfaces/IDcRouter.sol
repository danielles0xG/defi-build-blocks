// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

interface IDcRouter {
    struct UserPosition {
        uint256 deposit; // [1e6]
        uint256 shares; // [1e6]
    }

    struct UserAction {
        address user;
        uint256 amount;
    }

    event Deposited(address indexed user, uint256 indexed id, uint256 amount);
    event DepositTransferred(
        address indexed user,
        uint256 indexed strategyId,
        uint256 amount
    );
    event RequestedWithdraw(
        address indexed user,
        uint256 indexed id,
        uint256 amount
    );
    event Withdrawn(address indexed user, uint256 indexed id, uint256 amount);
    event CancelWithdrawn(
        address indexed user,
        uint256 indexed id,
        uint256 amount
    );

    function deposit(uint256 _strategyId, uint256 _stableAmount) external;

    function initiateWithdraw(uint256 _strategyId, uint256 _stableAmount)
        external;

    function pullOutLossERC20(address _token) external;

    function withdrawLostETH() external;

    function approveWithdraw(
        uint256 _stableDeTokenPrice,
        uint256 _strategyId,
        uint256 _withdrawalId
    ) external returns (bool);

    function nativeBridge(
        address _nativeStableToken,
        uint256 _stableAmount,
        uint16 _receiverLZId,
        address _receiverAddress,
        address _destinationStableToken
    ) external payable;

    function cancelWithdraw(uint256 _withdrawalId, uint256 _strategyId)
        external
        returns (bool);

    function transferDeposits(bytes memory _payload) external payable;

    function getDeCommasTreasurer() external view returns (address);

    function getNativeChainId() external view returns (uint16);

    function getCurrentStableToken() external view returns (address);
}
