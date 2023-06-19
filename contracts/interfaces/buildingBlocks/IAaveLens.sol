// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "../../integrations/aave/v3/DataTypes.sol";
import "../../integrations/aave/v3/IRewardsController.sol";
import "../../integrations/aave/v3/IPool.sol";

interface IAaveLens {
    function rewardsController() external view returns (IRewardsController);

    function aaveProvider() external view returns (IPoolAddressesProvider);

    function aavePool() external view returns (IPool);

    /**
     * @notice Returns a single rewards balance of a user, including virtually accrued and unrealized claimable rewards.
     * @param _aTokens List of incentivized assets to check eligible distributions
     * @param _user The address of the user
     * @return The user rewards balance
     **/
    function getAllUserRewards(address[] calldata _aTokens, address _user)
        external
        view
        returns (address[] memory, uint256[] memory);

    /**
     * @notice Returns the eMode the user is using
     * @param _user The address of the user
     * @return The eMode id
     */
    function getUserEMode(address _user) external view returns (uint256);

    /**
     * @notice Returns the configuration of the user across all the reserves
     * @param _user The user address
     * @dev bitmap details https://docs.aave.com/developers/core-contracts/pool#getuserconfiguration
     * @return The bitmap configuration of the user
     **/
    function getUserConfiguration(address _user)
        external
        view
        returns (DataTypes.UserConfigurationMap memory);

    /**
     * @notice Returns the list of initialized reserves.
     */
    function getReservesList() external view returns (address[] memory);

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
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );

    /**
     * @notice  The aTokens’ value is pegged to the value of the corresponding supplied asset at a 1:1 ratio
     * @param _assets list of token addresses supplied as collateral
     * @return usdcPositions - balance of aToken pegged to each asset in terms of USDC
     */
    function getPositionSizes(address _user, address[] calldata _assets)
        external
        view
        returns (uint256[] memory usdcPositions);

    /**
     * @notice  The aTokens’ value is pegged to the value of the corresponding supplied asset at a 1:1 ratio
     * @param _assets list of token addresses supplied as collateral
     * @return usdcPositions - balance of aToken pegged to each asset in terms of USDC
     */
    function getPositionSizesInUSDC(address _user, address[] calldata _assets)
        external
        view
        returns (uint256[] memory usdcPositions);
}
