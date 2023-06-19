// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IDcPerpetualVault {
    event PositionAdjusted(
        bool operationType,
        bool positionType,
        uint256 amount
    );
    event USDCDeposited(uint256 indexed timeStamp, uint256 amount);
    event USDCWithdrawn(address sender, uint256 amount);
    event EmergencyClosed(address sender, uint256 amount);

    function directDepositToVault(bytes memory _data) external;

    function adjustPosition(bytes memory _data) external;

    function emergencyClose() external;

    function setPerpRefCode(string memory _code) external;

    function accountValue(address _trader) external view returns (int256);

    function getFreeCollateral(address _trader) external view returns (uint256);

    function getNativeStrategyTokenPrice() external view returns (uint256);

    function totalAbsPositionValue() external view returns (uint256 value);

    function getTotalUSDCValue() external view returns (uint256);

    function getCurrentFundingRate() external view returns (uint256);
}
