// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "../integrations/lib/Math.sol";
import "../integrations/perpetual/IClearingHouse.sol";
import "../integrations/perpetual/IVault.sol";
import "../integrations/perpetual/IIndexPrice.sol";
import "../integrations/stargate/ISgBridge.sol";
import "../integrations/perpetual/IAccountBalance.sol";
import "../integrations/perpetual/IClearingHouseConfig.sol";
import "../integrations/perpetual/IExchange.sol";
import "../interfaces/IWETH.sol";
import "../interfaces/buildingBlocks/IDcPerpetualVault.sol";
import "./BaseBuildingBlock.sol";

/**
    @author DeCommas tea
    @title Perp protocol interface to open and close positions for specific pair and leverage size.
 */
contract DcPerpetualVault is BaseBuildingBlock, IDcPerpetualVault {
    IClearingHouse public clearingHouse;
    IVault public perpVault;
    IERC20 public wToken;
    IERC20 public vToken;

    // the restriction on when this tx should be executed; otherwise, it fails
    uint160 public deadlineTime;
    bytes32 public perpReferralCode;

    /**
     * @dev Sets the addresses for USDC stableCoin, wETH token address,UniswapRouter, Perpetual ClearingHouse,
     * Perpetual Vault(AccountBalance contract), Perpetual vToken for Strategy,
     * initialize to base shares for position
     */
    function initialize(bytes memory _data) public initializer {
        (
            ILayerZeroEndpointUpgradeable nativeLZEndpoint,
            IActionPoolDcRouter actionPoolDcRouter,
            IClearingHouse clearingHouseAddress,
            IVault perpVaultAddress,
            IERC20 usdcTokenAddress,
            IERC20 wTokenAddress,
            uint16 actionPoolId,
            uint16 nativeId,
            uint160 deadline
        ) = abi.decode(
                _data,
                (
                    ILayerZeroEndpointUpgradeable,
                    IActionPoolDcRouter,
                    IClearingHouse,
                    IVault,
                    IERC20,
                    IERC20,
                    uint16,
                    uint16,
                    uint160
                )
            );

        require(
            address(nativeLZEndpoint) != address(0),
            "PERP BB: zero address"
        );
        require(
            address(actionPoolDcRouter) != address(0),
            "PERP BB: zero address"
        );
        require(
            address(clearingHouseAddress) != address(0),
            "PERP BB: zero address"
        );
        require(
            address(perpVaultAddress) != address(0),
            "PERP BB: zero address"
        );
        require(
            address(usdcTokenAddress) != address(0),
            "PERP BB: zero address"
        );
        require(address(wTokenAddress) != address(0), "PERP BB: zero address");
        require(actionPoolId > 0, "PERP BB: zero amount");
        require(nativeId > 0, "PERP BB: zero amount");

        __Ownable_init();
        __LzAppUpgradeable_init(address(nativeLZEndpoint));
        _transferOwnership(_msgSender());

        _nativeChainId = nativeId;
        _currentUSDCToken = address(usdcTokenAddress);
        lzEndpoint = nativeLZEndpoint;
        trustedRemoteLookup[actionPoolId] = abi.encodePacked(
            address(actionPoolDcRouter),
            address(this)
        );
        _actionPool = address(actionPoolDcRouter);

        clearingHouse = IClearingHouse(clearingHouseAddress);
        perpVault = IVault(perpVaultAddress);
        vToken = IERC20(clearingHouse.getQuoteToken());
        wToken = wTokenAddress;
        deadlineTime = deadline;

        IERC20(_currentUSDCToken).approve(
            address(perpVault),
            type(uint256).max
        );
    }

    /**
     * @notice direct deposit into perpetual protocol vault
     * @dev used for native chain _deposits
     * @param _data :  bytes decodes to ampunt to deposit usdc
     */
    function directDepositToVault(bytes memory _data) external override {
        uint256 amount = abi.decode(_data, (uint256));
        require(amount > 0, "PERP BB: zero amount");
        _depositToVault(amount);
    }

    /**
     * @notice Function to Adjust/open -short-long and fullclose positions
     * @param _data - operationType: open/close position,positionType: true/false (long/short) & position amount
     * @dev User must deposit usdc prior to calling this method
     */
    function adjustPosition(bytes memory _data) external override {
        int256 intAmount = abi.decode(_data, (int256));
        bool positionType = intAmount > 0 ? true : false;
        uint256 amount = _abs(intAmount);

        if (positionType) {
            _depositToVault(amount);
            _openPosition(amount, positionType);
        } else {
            _openPosition(amount, positionType);
            _withdrawFromPerp(amount);
        }

        emit PositionAdjusted(
            true, // open position
            positionType,
            amount
        );
    }

    /**
       @notice closePosition on perp
       @dev withdraw all collateral available from perp vault (usdt stays in the BB)
       @dev one can withdraw the amount up to your freeCollateral.
     */
    function emergencyClose() public override onlySelf {
        _closePosition(0);
        uint256 collateral = perpVault.getFreeCollateral(address(this));
        _withdrawFromPerp(collateral);
        emit EmergencyClosed(msg.sender, collateral);
    }

    /**
     * @notice Uupdate perp ref code
     * @param _code new code
     */
    function setPerpRefCode(string memory _code) public override onlySelf {
        perpReferralCode = _stringToBytes32(_code);
    }

    /**
     *  @notice Get trader's Account Value
     *  @param _trader user account's value
     */
    function accountValue(address _trader)
        external
        view
        override
        returns (int256)
    {
        return clearingHouse.getAccountValue(_trader);
    }

    /**
     *  @notice Check how much collateral a trader can withdraw
     *  @param _trader user account's value
     */
    function getFreeCollateral(address _trader)
        external
        view
        override
        returns (uint256)
    {
        return perpVault.getFreeCollateral(_trader);
    }

    /**
     * @notice Price of underlying perp asset [1e6]
     */
    function getNativeStrategyTokenPrice()
        external
        view
        override
        returns (uint256)
    {
        // wBTC, wETH or other
        IClearingHouseConfig config = IClearingHouseConfig(
            clearingHouse.getClearingHouseConfig()
        );
        return
            IIndexPrice(address(vToken)).getIndexPrice(
                config.getTwapInterval()
            ) / 1e12;
    }

    function totalAbsPositionValue()
        external
        view
        override
        returns (uint256 value)
    {
        value = IAccountBalance(perpVault.getAccountBalance())
            .getTotalAbsPositionValue(address(this));
    }

    /**
     * @notice Strategy worth nominated in the USDC
     */
    function getTotalUSDCValue() external view override returns (uint256) {
        uint256 reserve = IERC20(_currentUSDCToken).balanceOf(address(this));
        return
            _abs(clearingHouse.getAccountValue(address(this))) /
            1e12 +
            reserve +
            Math.mulDiv(
                IERC20(wToken).balanceOf(address(this)),
                this.getNativeStrategyTokenPrice(),
                1e18
            );
    }

    /**
     * @notice if funding rate is more than 1 => long positions pays to short
     * vise versa otherwise
     * @return fundingRate_10_6
     * @dev Current funding rate for the perpV2
     */
    function getCurrentFundingRate() external view override returns (uint256) {
        return
            Math.mulDiv(
                _getDailyMarketTwap(),
                1e18,
                this.getNativeStrategyTokenPrice()
            ) / 1e12;
    }

    /*
     *  @notice Deposit prior to opening a position
     *  @param _data decode:
     *  @dev _baseToken the address of the base token; specifies which market you want to trade in
     */
    function _openPosition(uint256 _amount, bool _positionType)
        internal
        returns (uint256)
    {
        IClearingHouse.OpenPositionParams memory params = IClearingHouse
            .OpenPositionParams({
                baseToken: address(vToken),
                isBaseToQuote: _positionType, // false for longing base token
                isExactInput: false, // specifying `exactInput` or `exactOutput uniV2
                amount: _amount,
                oppositeAmountBound: 0, // the restriction on how many token to receive/pay, depending on `isBaseToQuote` & `isExactInput`
                sqrtPriceLimitX96: 0, // 0 for no price limit
                deadline: block.timestamp + deadlineTime,
                referralCode: perpReferralCode
            });

        // quote is the amount of quote token taker pays
        // base is the amount of base token taker gets
        (uint256 base, ) = clearingHouse.openPosition(params);
        return base;
    }

    function _withdrawFromPerp(uint256 amount)
        internal
        returns (uint256 _amount)
    {
        uint256 freeCollateral = perpVault.getFreeCollateral(address(this));
        if (amount > freeCollateral) {
            perpVault.withdraw(address(_currentUSDCToken), freeCollateral);
            _amount = freeCollateral;
        } else {
            perpVault.withdraw(address(_currentUSDCToken), amount);
            _amount = amount;
        }
    }

    function _stringToBytes32(string memory source)
        internal
        pure
        returns (bytes32 result)
    {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }

    /**
     * @dev Price of LONG asset [1e18]
     */
    function _getDailyMarketTwap() internal view returns (uint256) {
        uint32 interval = IClearingHouseConfig(
            clearingHouse.getClearingHouseConfig()
        ).getTwapInterval();
        uint160 dailyMarketTwap160X96 = IExchange(clearingHouse.getExchange())
            .getSqrtMarkTwapX96(address(vToken), interval);
        uint256 dailyMarketTwapX96 = Math.formatSqrtPriceX96ToPriceX96(
            dailyMarketTwap160X96
        );
        return Math.formatX96ToX10_18(dailyMarketTwapX96);
    }

    function _abs(int256 value) internal pure returns (uint256) {
        return value >= 0 ? uint256(value) : uint256(-value);
    }

    function _depositToVault(uint256 _amount) internal {
        IERC20(_currentUSDCToken).approve(address(perpVault), _amount);
        perpVault.deposit(address(_currentUSDCToken), _amount);
        emit USDCDeposited(block.timestamp, _amount);
    }

    /**
     * @notice Close perp position
     * @param _amount the amount specified. this can be either the input amount or output amount.
     * @return true if transaction completed
     */
    function _closePosition(uint256 _amount) internal returns (bool) {
        clearingHouse.closePosition(
            IClearingHouse.ClosePositionParams({
                baseToken: address(vToken),
                sqrtPriceLimitX96: 0,
                oppositeAmountBound: _amount,
                deadline: block.timestamp + deadlineTime,
                referralCode: perpReferralCode
            })
        );
        return true;
    }

    uint256[50] private __gap;
}
