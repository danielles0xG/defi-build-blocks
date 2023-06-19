// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IStrategyRegistry.sol";
import "./integrations/layerzero/NonBlockingNonUpgradableBaseApp.sol";

contract StrategyRegistry is
    IStrategyRegistry,
    NonBlockingNonUpgradableBaseApp
{
    uint16 private _chainCount;
    // Actually a constant array of lz chainIds packed in the uint256.
    uint256 private _chainIdBitmask;

    // @dev Get BB proxy address for strategy — chainId — BBId
    mapping(uint256 => mapping(uint16 => mapping(address => address)))
        public blockForStrategy;

    constructor(
        uint16 _chainCountArg,
        uint256 _chainIdBitmaskArg,
        uint16 _nativeId,
        address _nativeLZEndpoint,
        address _actionPoolDcRouter,
        uint16 _actionPoolNativeId
    ) {
        _chainCount = _chainCountArg;
        _chainIdBitmask = _chainIdBitmaskArg;

        _nativeChainId = _nativeId;
        lzEndpoint = ILayerZeroEndpoint(_nativeLZEndpoint);
        _actionPool = _actionPoolDcRouter;
        _transferOwnership(_msgSender());
        trustedRemoteLookup[_actionPoolNativeId] = abi.encodePacked(
            _actionPoolDcRouter
        );
    }

    // @dev Fetch BBs across all chains for particular impl and strategy
    function getBBs(uint256 _strategyId, address _bb)
        external
        view
        override
        returns (BB[] memory)
    {
        BB[] memory buildingBlocks = new BB[](_chainCount);
        for (uint256 i = 0; i < _chainCount; i++) {
            uint16 chainId = (uint16)((_chainIdBitmask >> (i * 16)) & 0xFFFF);
            if (blockForStrategy[_strategyId][chainId][_bb] != address(0)) {
                buildingBlocks[i] = BB({
                    bb: blockForStrategy[_strategyId][chainId][_bb],
                    chainId: chainId
                });
            }
        }
        return buildingBlocks;
    }

    // @dev Check if BB proxy exists for given strategy, chainId and bb impl
    function check(
        uint256 _strategyId,
        uint16 _chainId,
        address _bb
    ) external view override returns (bool) {
        return blockForStrategy[_strategyId][_chainId][_bb] != address(0);
    }

    // @dev Add new BB proxy to registry.
    function addBB(
        uint256 _strategyId,
        uint16 _chainId,
        address _bbImpl,
        address _bb
    ) public override onlySelf {
        blockForStrategy[_strategyId][_chainId][_bbImpl] = _bb;

        emit BBAdded(_strategyId, _chainId, _bbImpl, _bb);
    }
}
