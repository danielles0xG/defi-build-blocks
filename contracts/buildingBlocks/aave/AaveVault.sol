// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "../../integrations/aave/v3/IPool.sol";
import "../../integrations/aave/v3/IRewardsController.sol";
import "../../integrations/aave/v3/IWETHGateway.sol";
import "../../interfaces/buildingBlocks/IAaveVault.sol";
import "../../interfaces/buildingBlocks/IAaveStrategy.sol";
import "../BaseBuildingBlock.sol";

/**
 * @author DeCommas team
 * @title Aave protocol interface to open, close positions and borrow assets
 */
contract AaveVault is BaseBuildingBlock, IAaveVault {
    IPoolAddressesProvider public aaveProvider;
    IPool public aaveLendingPool;
    IWETHGateway public wethGateway;
    IRewardsController public rewardsController;
    address public aaveStrategy;

    /**
     * @notice Initializer
     * @param _data encode for:
     * @dev _aaveProvider aave Pool provider address
     * @dev _wethGateway weth network gateway
     * @dev _rewardsController rewards controller address
     */
    function initialize(bytes memory _data) public initializer {
        (
            IPoolAddressesProvider aaveProviderAddress,
            IWETHGateway wethGatewayAddress,
            IRewardsController rewardsControllerAddress,
            IActionPoolDcRouter actionPoolDcRouter,
            uint16 actionPoolId,
            ILayerZeroEndpointUpgradeable nativeLZEndpoint,
            uint16 nativeId,
            IERC20 usdcToken
        ) = abi.decode(
                _data,
                (
                    IPoolAddressesProvider,
                    IWETHGateway,
                    IRewardsController,
                    IActionPoolDcRouter,
                    uint16,
                    ILayerZeroEndpointUpgradeable,
                    uint16,
                    IERC20
                )
            );

        require(
            address(actionPoolDcRouter) != address(0),
            "AAVE BB: zero address."
        );
        require(
            address(nativeLZEndpoint) != address(0),
            "AAVE BB: zero address."
        );
        require(address(usdcToken) != address(0), "AAVE BB: zero address.");
        require(
            address(aaveProviderAddress) != address(0),
            "AAVE BB: zero address."
        );
        require(
            address(wethGatewayAddress) != address(0),
            "AAVE BB: zero address."
        );
        require(
            address(rewardsControllerAddress) != address(0),
            "AAVE BB: zero address."
        );
        require(nativeId > 0, "AAVE BB: zero id.");

        __Ownable_init();
        __LzAppUpgradeable_init(address(nativeLZEndpoint));
        _transferOwnership(_msgSender());

        _nativeChainId = nativeId;
        _currentUSDCToken = address(usdcToken);
        lzEndpoint = nativeLZEndpoint;
        trustedRemoteLookup[actionPoolId] = abi.encodePacked(
            address(actionPoolDcRouter),
            address(this)
        );
        _actionPool = address(actionPoolDcRouter);

        aaveProvider = aaveProviderAddress;
        aaveLendingPool = IPool(aaveProvider.getPool());
        wethGateway = wethGatewayAddress;
        rewardsController = rewardsControllerAddress;
    }

    function setAaveStrategy(bytes memory _data) public override {
        address aaveStrategyAddress = _bytesToAddress(_data);
        aaveStrategy = aaveStrategyAddress;
    }

    /**
     * @notice Allows a user to use the protocol in eMode
     * @param _data categoryId The id of the category
     * @dev id (0 - 255) defined by Risk or Pool Admins. categoryId == 0 ⇒ non E-mode category.
     */
    function setUserEMode(bytes memory _data) public override {
        uint8 categoryId = abi.decode(_data, (uint8));
        aaveLendingPool.setUserEMode(categoryId);
    }

    /**
     * @notice Sets a an asset already deposited as collateral for a future borrow
     * @dev Supply collateral first, then setCollateralAsset
     * @param _data collateral Asset address
     */
    function setCollateralAsset(bytes memory _data) public override {
        address collateralAsset = _bytesToAddress(_data);
        aaveLendingPool.setUserUseReserveAsCollateral(
            address(collateralAsset),
            true
        );
    }

    /**
     * @notice Opens a new position (supply collateral) as liquidity provider on AAVE
     * @param _data baseAsset asset address, amount to deposit
     */
    function openPosition(bytes memory _data) public override {
        (IERC20 baseAsset, uint256 amount, uint16 referralCode) = abi.decode(
            _data,
            (IERC20, uint256, uint16)
        );
        if (address(baseAsset) == address(0x0)) {
            require(
                amount <= address(this).balance,
                "AAVE BB: Deposit or bridge nativeAsset"
            );
            wethGateway.depositETH{value: amount}(
                address(aaveLendingPool),
                address(this),
                referralCode
            );
        } else {
            require(
                amount <= baseAsset.balanceOf(address(this)),
                "AAVE BB: Deposit or bridge baseAsset"
            );
            baseAsset.approve(address(aaveLendingPool), amount);
            aaveLendingPool.supply(
                address(baseAsset),
                amount,
                address(this),
                referralCode
            );
        }
        emit OpenPositionEvent(baseAsset, amount);
    }

    /**
     * @notice Aave Borrows an asset
     * @param _data baseAsset address, amount to borrow
     */
    function borrow(bytes memory _data) public override {
        (
            IERC20 borrowAsset,
            uint256 amount,
            uint16 borrowRate,
            uint16 referralCode
        ) = abi.decode(_data, (IERC20, uint256, uint16, uint16));

        if (address(borrowAsset) == address(0x0)) {
            wethGateway.borrowETH(
                address(aaveLendingPool),
                amount,
                borrowRate,
                referralCode
            );
        } else {
            aaveLendingPool.borrow(
                address(borrowAsset),
                amount,
                borrowRate,
                referralCode,
                address(this)
            );
        }
        require(
            IERC20(address(borrowAsset)).approve(address(aaveStrategy), amount),
            "AAVE BB - strat approval"
        );
        emit BorrowEvent(borrowAsset, amount);
    }

    /**
     * @notice Repays a loan (partially or fully)
     * @dev using default Fixed rates
     */
    function repay(bytes memory _data) public payable override {
        (IERC20 asset, uint256 amount, uint16 borrowRate) = abi.decode(
            _data,
            (IERC20, uint256, uint16)
        );

        if (address(asset) == address(0x0)) {
            require(msg.value == amount, "AAVE BB: msg.value mismatch amount");
            wethGateway.repayETH(
                address(aaveLendingPool),
                amount,
                borrowRate,
                address(this)
            );
        } else {
            asset.approve(address(aaveLendingPool), amount);
            aaveLendingPool.repay(
                address(asset),
                amount,
                borrowRate,
                address(this)
            );
        }
        emit RepayEvent(asset, amount);
    }

    /**
     * @notice Closes a position as liquidity provider on AAVE
     * @param _data asset address,amount to withdraw
     */
    function closePosition(bytes memory _data) public override onlySelf {
        (IERC20 asset, uint256 amount) = abi.decode(_data, (IERC20, uint256));
        if (address(asset) == address(0x0)) {
            wethGateway.withdrawETH(
                address(aaveLendingPool),
                amount,
                address(this)
            );
        } else {
            aaveLendingPool.withdraw(address(asset), amount, address(this));
        }
        emit ClosePositionEvent(asset, amount);
    }

    /**
     * @notice Returns a list all rewards of a user, including already accrued and unrealized claimable rewards
     * @param _data List of incentivized assets to check eligible distributions, The address of the user
     **/
    function claimAllRewards(bytes memory _data) public override onlySelf {
        (address[] memory assets, address user) = abi.decode(
            _data,
            (address[], address)
        );
        rewardsController.claimAllRewards(assets, user);
        emit ClaimedRewardsEvent(assets, user);
    }

    function _bytesToAddress(bytes memory _bys)
        private
        pure
        returns (address addr)
    {
        assembly {
            addr := mload(add(_bys, 20))
        }
    }

    uint256[50] private __gap;
}
