// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./integrations/layerzero/NonBlockingNonUpgradableBaseApp.sol";
import "./interfaces/IBBFabric.sol";

/**
 * @dev Originally based on code by https://github.com/Pillardevelopment
 */
contract BBFabric is NonBlockingNonUpgradableBaseApp, IBBFabric {
    /// array save data about basic blocks of current EVM network
    mapping(address => BaseBlockData) private _bBlocks;

    BaseBlockData[] private _allBlockInChain;

    uint16 private _registryChainId;
    address private _registryAddress;

    constructor(
        uint16 _nativeId,
        address _nativeLZEndpoint,
        address _actionPoolDcRouter,
        uint16 _actionPoolNativeId,
        uint16 _registryChainIdArg,
        address _registryAddressArg
    ) {
        _nativeChainId = _nativeId;
        lzEndpoint = ILayerZeroEndpoint(_nativeLZEndpoint);
        trustedRemoteLookup[_actionPoolNativeId] = abi.encodePacked(
            _actionPoolDcRouter,
            address(this)
        );
        _actionPool = _actionPoolDcRouter;
        _transferOwnership(_msgSender());

        _registryChainId = _registryChainIdArg;
        _registryAddress = _registryAddressArg;
    }

    function getProxyAddressToId(uint256 _allBlockInChainId)
        external
        view
        override
        returns (address)
    {
        return _allBlockInChain[_allBlockInChainId].proxy;
    }

    function getImplToProxyAddress(address _proxy)
        external
        view
        override
        returns (address impl)
    {
        impl = _bBlocks[_proxy].implement;
    }

    function getStrategyIdToProxyAddress(address _proxy)
        external
        view
        override
        returns (uint256 strategyId)
    {
        strategyId = _bBlocks[_proxy].id;
    }

    function getAllBbData()
        external
        view
        override
        returns (BaseBlockData[] memory)
    {
        return _allBlockInChain;
    }

    function getNativeChainId() external view override returns (uint16) {
        return _nativeChainId;
    }

    function nativeInitNewProxy(
        uint256 _strategyId,
        address _implementation,
        bytes memory _dataForConstructor
    ) public override onlySelf returns (bool) {
        return _initProxy(_strategyId, _implementation, _dataForConstructor);
    }

    function nativeUpgradeProxyImplementation(
        uint256 _strategyId,
        address _proxyAddr,
        address _newImplAddr
    ) public override onlySelf returns (bool) {
        return _upgradeProxy(_strategyId, _proxyAddr, _newImplAddr);
    }

    /**
     * @param _strategyId - strategy number by which it will be identified
     * @param _implementation - address of Building block contract proxy's source code
     * @param _dataForConstructor - data for  initialize function in Building block contract
     */
    function initNewProxy(
        uint256 _strategyId,
        address _implementation,
        bytes memory _dataForConstructor
    ) public override onlySelf returns (bool) {
        return _initProxy(_strategyId, _implementation, _dataForConstructor);
    }

    /**
     * @param _strategyId - strategy number by which it will be identified
     * @param _proxyAddr - address of proxy's Building block contract, have storage and state
     * @param _newImplAddr - address of modified Building block contract proxy's source code
     */
    function upgradeProxyImplementation(
        uint256 _strategyId,
        address _proxyAddr,
        address _newImplAddr
    ) public override onlySelf returns (bool) {
        return _upgradeProxy(_strategyId, _proxyAddr, _newImplAddr);
    }

    function _initProxy(
        uint256 _strategyId,
        address _implementation,
        bytes memory _dataForConstructor
    ) internal returns (bool) {
        bytes memory emptyData;
        ERC1967Proxy proxy = new ERC1967Proxy(_implementation, emptyData);
        bytes memory initializeData = abi.encodeWithSelector(
            bytes4(keccak256(bytes("initialize(bytes)"))),
            _dataForConstructor
        );
        (bool success, bytes memory returnData) = address(proxy).call(
            initializeData
        );
        if (!success) {
            revert("BBFabric: failed to instantiate bb");
        }
        BaseBlockData memory newBaseBlockData = BaseBlockData({
            id: _strategyId,
            implement: _implementation,
            proxy: address(proxy)
        });
        _allBlockInChain.push(newBaseBlockData);
        _bBlocks[address(proxy)] = newBaseBlockData;
        emit NewBBCreated(
            _strategyId,
            _implementation,
            address(proxy),
            returnData
        );

        _notifyRegistry(_strategyId, _implementation, address(proxy));

        return success;
    }

    function _notifyRegistry(
        uint256 _strategyId,
        address _implAddress,
        address _newProxyAddress
    ) internal {
        bytes memory adapterParams = abi.encodePacked(
            uint16(1), //version
            uint256(200000) // gas for destination
        );
        bytes4 funcSelector = bytes4(
            keccak256("addBB(uint256,uint16,address,address)")
        );
        bytes memory actionData = abi.encodeWithSelector(
            funcSelector,
            _strategyId,
            _nativeChainId,
            _implAddress,
            _newProxyAddress
        );
        bytes memory oldTrustedRemote = trustedRemoteLookup[_registryChainId];
        trustedRemoteLookup[_registryChainId] = abi.encodePacked(
            _registryAddress,
            address(this)
        );
        _lzSend(
            _registryChainId,
            actionData,
            payable(address(this)),
            address(0x0),
            adapterParams,
            address(this).balance
        );
        trustedRemoteLookup[_registryChainId] = oldTrustedRemote;
    }

    function _upgradeProxy(
        uint256 _strategyId,
        address _proxyAddr,
        address _newImplAddr
    ) internal returns (bool) {
        require(
            _bBlocks[_proxyAddr].id == _strategyId,
            "BBFabric: incorrect strategyId"
        );
        bytes memory upgradeData = abi.encodeWithSelector(
            bytes4(keccak256(bytes("upgradeTo(address)"))),
            _newImplAddr
        );
        (bool success, bytes memory returnData) = address(_proxyAddr).call(
            upgradeData
        );
        _bBlocks[_proxyAddr].implement = _newImplAddr;
        emit UpgradeBBImplementation(
            _strategyId,
            _newImplAddr,
            _proxyAddr,
            returnData
        );
        return success;
    }
}
