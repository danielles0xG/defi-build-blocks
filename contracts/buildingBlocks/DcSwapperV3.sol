// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;
import "../integrations/uniswap/v3/IV3SwapRouter.sol";
import "../integrations/uniswap/v3/IUniswapV3Factory.sol";
import "../integrations/uniswap/v3/IUniFactoryProvider.sol";
import "../integrations/uniswap/v3/IQuoter.sol";
import "../interfaces/IWETH.sol";
import "./BaseBuildingBlock.sol";
import "../interfaces/buildingBlocks/IDcSwapperV3.sol";

/**
 * @author DeCommas team
 * @title DcSwapper V3 - uniswap v3 integration
 */
contract DcSwapperV3 is BaseBuildingBlock, IDcSwapperV3 {
    IV3SwapRouter public amm;
    IUniswapV3Factory public factory;
    IQuoter public quoter;
    uint24[] public fees;

    function initialize(bytes memory _data) public initializer {
        (
            IV3SwapRouter routerAddress,
            IQuoter quoterAddress,
            IActionPoolDcRouter actionPoolDcRouter,
            ILayerZeroEndpointUpgradeable nativeLZEndpoint,
            IERC20 usdcToken,
            uint16 actionPoolId,
            uint16 nativeId,
            uint24[] memory feeLevels
        ) = abi.decode(
                _data,
                (
                    IV3SwapRouter,
                    IQuoter,
                    IActionPoolDcRouter,
                    ILayerZeroEndpointUpgradeable,
                    IERC20,
                    uint16,
                    uint16,
                    uint24[]
                )
            );
        require(
            address(routerAddress) != address(0x0),
            "UniswapV3 BB: zero address"
        );
        require(
            address(quoterAddress) != address(0x0),
            "UniswapV3 BB: zero address"
        );
        require(
            address(actionPoolDcRouter) != address(0x0),
            "UniswapV3 BB: zero address"
        );
        require(
            address(nativeLZEndpoint) != address(0x0),
            "UniswapV3 BB: zero address"
        );
        require(
            address(usdcToken) != address(0x0),
            "UniswapV3 BB: zero address"
        );
        require(actionPoolId > 0, "UniswapV3 BB: zero id.");
        require(nativeId > 0, "UniswapV3 BB: zero id.");
        require(
            feeLevels.length > 0,
            "UniswapV3 BB: invalid uniswap fee levels."
        );

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

        amm = routerAddress;
        factory = IUniFactoryProvider(address(routerAddress)).factory();
        quoter = quoterAddress;
        IERC20(amm.WETH9()).approve(address(routerAddress), type(uint256).max);
        fees = feeLevels;
    }

    function setDex(bytes memory _data) public override {
        address ammAddress = abi.decode(_data, (address));
        amm = IV3SwapRouter(ammAddress);
        factory = IUniFactoryProvider(ammAddress).factory();
        IERC20(amm.WETH9()).approve(ammAddress, type(uint256).max);
    }

    function setQuoter(bytes memory _data) public override {
        address newQuoter = abi.decode(_data, (address));
        quoter = IQuoter(newQuoter);
    }

    function setFeesLevels(bytes memory _data) public override {
        uint24[] memory newFees = abi.decode(_data, (uint24[]));
        fees = newFees;
    }

    /**
     * @notice Swap exact input
     */
    function swap(bytes memory _data)
        public
        payable
        override
        returns (uint256)
    {
        (
            address tokenA,
            address tokenB,
            uint256 amount,
            address recipient
        ) = abi.decode(_data, (address, address, uint256, address));
        address swapTokenA = tokenA;
        address swapTokenB = tokenB;
        if (tokenA != address(0x0)) {
            require(
                IERC20(tokenA).balanceOf(address(this)) >= amount,
                "DcSwapperV3 : Deposit or bridge swap amountIn"
            );
            IERC20(tokenA).approve(address(amm), amount);
        } else {
            require(msg.value == amount, "DcSwapperV3 : amount-mismatch");
            swapTokenA = amm.WETH9();
            IWETH(amm.WETH9()).deposit{value: msg.value}();
        }
        if (tokenB == address(0x0)) {
            swapTokenB = amm.WETH9();
        }

        (, uint24 fee, , ) = _getBestFees(swapTokenA, swapTokenB);
        require(fee != 0, "UniswapperV3/no-pool");
        require(
            IERC20(swapTokenA).approve(address(amm), amount),
            "UniswapV3 BB: router approval failed"
        );
        IV3SwapRouter.ExactInputSingleParams memory params = IV3SwapRouter
            .ExactInputSingleParams({
                tokenIn: swapTokenA,
                tokenOut: swapTokenB,
                fee: fee,
                recipient: recipient,
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        return amm.exactInputSingle(params);
    }

    function isTokensSupported(address _bridgeToken, address[] memory _tokens)
        public
        view
        override
        returns (bool[] memory)
    {
        bool[] memory results = new bool[](_tokens.length);
        for (uint256 i = 0; i < _tokens.length; i++) {
            results[i] = _isTokenSupported(_bridgeToken, _tokens[i]);
        }
        return results;
    }

    function isPairsSupported(address[][] calldata _tokens)
        public
        view
        override
        returns (bool[] memory)
    {
        bool[] memory results = new bool[](_tokens.length);
        for (uint256 i = 0; i < _tokens.length; i++) {
            (address pool, , , ) = _getBestFees(_tokens[i][0], _tokens[i][1]);
            results[i] = pool != address(0x0);
        }
        return results;
    }

    // do not used on-chain, gas inefficient!
    function quote(bytes memory _data) public override returns (uint256) {
        (address tokenA, address tokenB, uint256 amount) = abi.decode(
            _data,
            (address, address, uint256)
        );
        if (tokenA == tokenB) {
            return 1;
        }
        (, uint24 fee, address swapTokenA, address swapTokenB) = _getBestFees(
            tokenA,
            tokenB
        );
        return
            quoter.quoteExactInputSingle(
                swapTokenA,
                swapTokenB,
                fee,
                amount,
                0
            );
    }

    function _isTokenSupported(address _bridgeToken, address _token)
        internal
        view
        returns (bool)
    {
        if (_bridgeToken == _token) {
            return true;
        } else {
            (address pool, , , ) = _getBestFees(_bridgeToken, _token);
            return pool != address(0x0);
        }
    }

    function _getBestFees(address tokenA, address tokenB)
        internal
        view
        returns (
            address,
            uint24,
            address,
            address
        )
    {
        if (tokenA == tokenB) {
            return (tokenA, 0, tokenA, tokenB);
        }
        address swapTokenA = tokenA;
        address swapTokenB = tokenB;
        if (tokenA == address(0x0)) {
            swapTokenA = amm.WETH9();
        }
        if (tokenB == address(0x0)) {
            swapTokenB = amm.WETH9();
        }
        for (uint256 i = 0; i < fees.length; i++) {
            address pool = factory.getPool(swapTokenA, swapTokenB, fees[i]);
            if (pool != address(0x0)) {
                return (pool, fees[i], swapTokenA, swapTokenB);
            }
        }
        return (address(0x0), 0, swapTokenA, swapTokenB);
    }

    uint256[50] private __gap;
}
