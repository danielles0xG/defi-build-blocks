// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "../../integrations/aave/v3/DataTypes.sol";
import "../../integrations/aave/v3/IRewardsController.sol";
import "../../integrations/aave/v3/IPool.sol";
import "../../integrations/aave/v3/IAaveOracle.sol";
import "../../integrations/aave/v3/IPoolDataProvider.sol";
import "../../interfaces/buildingBlocks/IAaveLens.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract AaveLens is IAaveLens {
    IRewardsController public override rewardsController;
    IPoolAddressesProvider public override aaveProvider;
    IPool public override aavePool;

    constructor(
        IPoolAddressesProvider _poolAddressesProvider,
        IRewardsController _rewardsController
    ) {
        require(
            address(_rewardsController) != address(0),
            "AAVE Lens: zero address."
        );
        require(
            address(_poolAddressesProvider) != address(0),
            "AAVE Lens: zero address."
        );
        rewardsController = _rewardsController;
        aaveProvider = _poolAddressesProvider;
        aavePool = IPool(aaveProvider.getPool());
    }

    /**
     * @notice Returns a single rewards balance of a user, including virtually accrued and unrealized claimable rewards.
     * @param _aTokens List of incentivized assets to check eligible distributions
     * @param _user The address of the user
     * @return The user rewards balance
     **/
    function getAllUserRewards(address[] calldata _aTokens, address _user)
        external
        view
        override
        returns (address[] memory, uint256[] memory)
    {
        return rewardsController.getAllUserRewards(_aTokens, _user);
    }

    /**
     * @notice Returns the eMode the user is using
     * @param _user The address of the user
     * @return The eMode id
     */
    function getUserEMode(address _user)
        external
        view
        override
        returns (uint256)
    {
        return aavePool.getUserEMode(_user);
    }

    /**
     * @notice Returns the configuration of the user across all the reserves
     * @param _user The user address
     * @dev bitmap details https://docs.aave.com/developers/core-contracts/pool#getuserconfiguration
     * @return The bitmap configuration of the user
     **/
    function getUserConfiguration(address _user)
        external
        view
        override
        returns (DataTypes.UserConfigurationMap memory)
    {
        return aavePool.getUserConfiguration(_user);
    }

    /**
     * @notice Returns the list of initialized reserves.
     */
    function getReservesList()
        external
        view
        override
        returns (address[] memory)
    {
        return aavePool.getReservesList();
    }

    /**
     * @notice Returns the user account data across all the reserves
     * @param  _user The address of the user
     * @return totalCollateralBase The total collateral of the user in the base currency used by the price feed
     * @return totalDebtBase The total debt of the user in the base currency used by the price feed
     * @return availableBorrowsBase The borrowing power left of the user in the base currency used by the price feed
     * @return currentLiquidationThreshold The liquidation threshold of the user
     * @return ltv The loan to value of The user
     * @return healthFactor The current health factor of the user
     **/
    function getUserAccountData(address _user)
        external
        view
        override
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        (
            totalCollateralBase,
            totalDebtBase,
            availableBorrowsBase,
            currentLiquidationThreshold,
            ltv,
            healthFactor
        ) = aavePool.getUserAccountData(_user);
    }

    /**
     * @notice  The aTokens’ value is pegged to the value of the corresponding supplied asset at a 1:1 ratio
     * @param _assets list of token addresses supplied as collateral
     * @return usdcPositions - balance of aToken pegged to each asset in terms of USDC
     */
    function getPositionSizes(address _user, address[] calldata _assets)
        external
        view
        override
        returns (uint256[] memory usdcPositions)
    {
        usdcPositions = new uint256[](_assets.length);
        for (uint256 i; i < _assets.length; i++) {
            (uint256 currentATokenBalance, , , , , , , , ) = IPoolDataProvider(
                aaveProvider.getPoolDataProvider()
            ).getUserReserveData(_assets[i], _user);
            usdcPositions[i] = currentATokenBalance;
        }
    }

    /**
     * @notice  The aTokens’ value is pegged to the value of the corresponding supplied asset at a 1:1 ratio
     * @param _assets list of token addresses supplied as collateral
     * @return usdcPositions - balance of aToken pegged to each asset in terms of USDC
     */
    function getPositionSizesInUSDC(address _user, address[] calldata _assets)
        external
        view
        override
        returns (uint256[] memory usdcPositions)
    {
        usdcPositions = new uint256[](_assets.length);

        // prices array is in the same order as _assets array
        uint256[] memory prices = IAaveOracle(aaveProvider.getPriceOracle())
            .getAssetsPrices(_assets);

        for (uint256 i; i < _assets.length; i++) {
            (uint256 currentATokenBalance, , , , , , , , ) = IPoolDataProvider(
                aaveProvider.getPoolDataProvider()
            ).getUserReserveData(_assets[i], _user);
            usdcPositions[i] =
                (currentATokenBalance * prices[i]) /
                10**IERC20Metadata(_assets[i]).decimals();
        }
    }
}
