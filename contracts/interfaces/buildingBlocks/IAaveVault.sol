// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../../integrations/aave/v3/IPool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAaveVault {
    event OpenPositionEvent(IERC20 baseAsset, uint256 amount);
    event ClosePositionEvent(IERC20 baseAsset, uint256 amount);
    event BorrowEvent(IERC20 baseAsset, uint256 amount);
    event RepayEvent(IERC20 baseAsset, uint256 amount);
    event ClaimedRewardsEvent(address[] assets, address user);

    function setUserEMode(bytes memory _data) external;

    function openPosition(bytes memory _data) external;

    function setCollateralAsset(bytes memory _data) external;

    function borrow(bytes memory _data) external;

    function repay(bytes memory _data) external payable;

    function closePosition(bytes memory _data) external;

    function claimAllRewards(bytes memory _data) external;

    function setAaveStrategy(bytes memory _data) external;
}
