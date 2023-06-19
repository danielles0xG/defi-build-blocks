// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "../../interfaces/IActionPoolDcRouter.sol";

import "../../integrations/aave/v3/DataTypes.sol";
import "../../integrations/aave/v3/IRewardsController.sol";
import "../../integrations/aave/v3/IPool.sol";
import "../../integrations/aave/v3/IAaveOracle.sol";
import "../../integrations/aave/v3/IPoolDataProvider.sol";
import "../../interfaces/buildingBlocks/IAaveStrategy.sol";
import "../../interfaces/buildingBlocks/IAaveVault.sol";

contract AaveStrategy is IAaveStrategy, UUPSUpgradeable {
    IActionPoolDcRouter public actionPool;
    IUniswapV2Router02 public uniswapV2Router;
    IPoolAddressesProvider public aaveProvider;
    IPool public aavePool;
    IAaveVault public aaveVault;

    modifier onlyDcRouter() {
        require(msg.sender == address(actionPool));
        _;
    }

    function initialize(bytes memory _data) public initializer {
        (
            IActionPoolDcRouter actionPoolDcRouterAddress,
            IAaveVault aaveVaultAddress,
            IUniswapV2Router02 uniswapV2RouterAddress,
            IPoolAddressesProvider aaveProviderAddress
        ) = abi.decode(
                _data,
                (
                    IActionPoolDcRouter,
                    IAaveVault,
                    IUniswapV2Router02,
                    IPoolAddressesProvider
                )
            );

        require(
            address(aaveVaultAddress) != address(0),
            "AAVE Strat: zero address."
        );
        require(
            address(actionPoolDcRouterAddress) != address(0),
            "AAVE Strat: zero address."
        );
        require(
            address(uniswapV2RouterAddress) != address(0),
            "AAVE Strat: zero address."
        );
        require(
            address(aaveProviderAddress) != address(0),
            "AAVE Strat: zero address."
        );

        actionPool = actionPoolDcRouterAddress;
        aaveVault = aaveVaultAddress;
        uniswapV2Router = uniswapV2RouterAddress;
        aaveProvider = aaveProviderAddress;
        aavePool = IPool(aaveProvider.getPool());
    }

    /**
     * @notice Swap exact tokens for Tokens uniswap v2
     * @param _data : amountIn to swap for amountOut, swap path and tx deadline time
     */
    function swap(bytes memory _data)
        public
        override
        onlyDcRouter
        returns (uint256 amountOut)
    {
        (
            uint256 amountIn,
            uint256 amountOutMin,
            address[] memory path,
            uint256 deadline
        ) = abi.decode(_data, (uint256, uint256, address[], uint256));
        require(
            IERC20(path[0]).transferFrom(
                address(aaveVault),
                address(this),
                amountIn
            ),
            "AAVE Strat: swap in tranfer fail"
        );

        require(
            IERC20(path[0]).balanceOf(address(this)) >= amountIn,
            "AAVE Strat: insufficient funds"
        );
        require(
            IERC20(path[0]).approve(address(uniswapV2Router), amountIn),
            "AAVE Strat: Router approval"
        );

        amountOut = uniswapV2Router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(aaveVault),
            block.timestamp + deadline
        )[path.length - 1];

        emit SwapEvent(path, amountIn, amountOut);
    }

    /**
     * @notice Sell borrowed asset from aave
     * @param _data : MarginShort struct
     * @dev
     * 1. supply collateral
     * 2. borrow asset
     * 3. sell asset on uniswap
     * 4. resupply USDC after selling
     */
    function marginShort(bytes memory _data) public override onlyDcRouter {
        MarginShort memory marginShortParams = abi.decode(_data, (MarginShort));

        // check we are selling the borrowed asset
        require(
            marginShortParams.path[0] ==
                address(marginShortParams.borrowAsset) &&
                marginShortParams.path[marginShortParams.path.length - 1] ==
                address(marginShortParams.supplyAsset),
            "AAVE Strat:Ms trade path"
        );
        // supply collateral
        aaveVault.openPosition(
            abi.encode(
                address(marginShortParams.supplyAsset),
                marginShortParams.supplyAmount,
                marginShortParams.referralCode
            )
        );
        // set collateral type before borrowing
        aaveVault.setCollateralAsset(
            abi.encodePacked(marginShortParams.supplyAsset)
        );

        // borrow amount
        (, , uint256 availableBorrowsBase, , , ) = aavePool.getUserAccountData(
            address(aaveVault)
        );
        uint256 assetPrice = IAaveOracle(aaveProvider.getPriceOracle())
            .getAssetPrice(address(marginShortParams.borrowAsset));
        uint256 borrowAmount = (availableBorrowsBase * assetPrice) /
            10 **
                IERC20Metadata(address(marginShortParams.borrowAsset))
                    .decimals();

        // borrow shorting asset
        aaveVault.borrow(
            abi.encode(
                marginShortParams.borrowAsset,
                borrowAmount,
                marginShortParams.borrowRate,
                marginShortParams.referralCode
            )
        );
        // check balance of borrowed balance is sent to strategy before selling it
        if (address(marginShortParams.borrowAsset) == address(0x0)) {
            require(
                IERC20(address(marginShortParams.borrowAsset)).balanceOf(
                    address(this)
                ) >= borrowAmount,
                "Aave Strategy:Ms borrow failed."
            );
        } else {
            require(
                address(this).balance >= borrowAmount,
                "Aave BB: Ms borrow failed."
            );
        }

        // Sell shorting asset
        uint256 amountOut = swap(
            abi.encode(
                borrowAmount,
                marginShortParams.tradeOutAmount,
                marginShortParams.path,
                marginShortParams.tradeDeadline
            )
        );

        require(
            IERC20(
                address(
                    marginShortParams.path[marginShortParams.path.length - 1]
                )
            ).balanceOf(address(this)) >= amountOut,
            "Aave Strat: Ms sell failed."
        );

        // supply more collateral
        aaveVault.openPosition(
            abi.encode(
                address(marginShortParams.supplyAsset),
                amountOut,
                marginShortParams.referralCode
            )
        );
        emit MarginShortEvent(marginShortParams);
    }

    function _authorizeUpgrade(address) internal override onlyDcRouter {}

    uint256[50] private __gap;
}
