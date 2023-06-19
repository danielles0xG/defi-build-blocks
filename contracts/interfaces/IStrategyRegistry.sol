// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStrategyRegistry {
    event BBAdded(
        uint256 indexed strategyId,
        uint16 indexed chainId,
        address bbImpl,
        address bb
    );

    struct BB {
        address bb;
        uint16 chainId;
    }

    function blockForStrategy(
        uint256 _strategyId,
        uint16 _chainId,
        address _bb
    ) external view returns (address);

    function getBBs(uint256 _strategyId, address _bb)
        external
        view
        returns (BB[] memory);

    function check(
        uint256 _strategyId,
        uint16 _chainId,
        address _bb
    ) external view returns (bool);

    function addBB(
        uint256 _strategyId,
        uint16 _chainId,
        address _bbImpl,
        address _bb
    ) external;
}
