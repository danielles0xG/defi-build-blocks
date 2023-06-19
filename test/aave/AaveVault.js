const { ether } = require("@openzeppelin/test-helpers");
const { BigNumber } = require("ethers");
const { ethers, artifacts } = require("hardhat");
const { expect } = require("chai");
const {
  UNISWAP_V2_BB,
  AAVE_BB,
  ACTION_POOL,
  LZ_ENDPOINTS,
  ASSETS,
} = require("../../config/addresses.json");

const AUSDC_AVAX = "0x625E7708f30cA75bfd92586e17077590C60eb4cD";
const WETH_AVAX = "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB";
const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
const aWAVAX = "0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97";
const FRAX_AVAX = "0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64";
const AFRAX_AVAX = "0xc45A479877e1e9Dfe9FcD4056c699575a1045dAA";

const USDC_AVAX = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const LINK_AVAX = "0x5947BB275c521040051D82396192181b413227A3";
const WBTC_AVAX = "0x50b7545627a5162F82A992c33b87aDc75187B218";
const USDT_AVAX = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7";
const AAVE_AVAX = "0x63a72806098Bd3D9520cC43356dD78afe5D386D9";
const BTCB_AVAX = "0x152b9d0FdC40C096757F570A51E494bd4b943E50";

/**
 * Avalanche mainnet - fork test, account with actual usdc funds needed
 */
// eslint-disable-next-line no-undef
contract("AAVE BB - Vault", function ([DEPLOYER, ACTION_POOL_LOCAL]) {
  const network = process.argv[process.argv.length - 1];
  const DEPOSIT_USDC_AMOUNT = BigNumber.from("8000000");

  if (network === "avalanche") {
    before(async function () {
      const signers = await ethers.getSigners();
      this.deployer = signers[0];
      this.actionPool = signers[1];

      this.AUSDC_AVAX = await ethers.getContractAt("ERC20Mock", AUSDC_AVAX);
      this.WETH_AVAX = await ethers.getContractAt("ERC20Mock", WETH_AVAX);
      this.WAVAX = await ethers.getContractAt("ERC20Mock", WAVAX);
      this.FRAX_AVAX = await ethers.getContractAt("ERC20Mock", FRAX_AVAX);
      this.AFRAX_AVAX = await ethers.getContractAt("ERC20Mock", AFRAX_AVAX);

      this.USDC_AVAX = await ethers.getContractAt("ERC20Mock", USDC_AVAX);
      this.LINK_AVAX = await ethers.getContractAt("ERC20Mock", LINK_AVAX);
      this.WBTC_AVAX = await ethers.getContractAt("ERC20Mock", WBTC_AVAX);
      this.USDT_AVAX = await ethers.getContractAt("ERC20Mock", USDT_AVAX);
      this.AAVE_AVAX = await ethers.getContractAt("ERC20Mock", AAVE_AVAX);
      this.BTCB_AVAX = await ethers.getContractAt("ERC20Mock", BTCB_AVAX);

      this.defaultEncoder = ethers.utils.defaultAbiCoder;

      const AAVE_VAULT = artifacts.require("AaveVault");
      this.aaveVault = await AAVE_VAULT.new();
      const USDC_ADDRESS = [
        "fujiavax",
        "polygonmumbai",
        "optimismgoerli",
      ].includes(network)
        ? AAVE_BB.AAVE[network].USDC
        : ASSETS.USDC[network];
      const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network)
        ? ACTION_POOL.TESTNET
        : ACTION_POOL.MAINNET;
      this.encoder = new ethers.utils.Interface(this.aaveVault.abi);
      const initParams = this.defaultEncoder.encode(
        [
          "address",
          "address",
          "address",
          "address",
          "uint16",
          "address",
          "uint16",
          "address",
          "address",
        ],
        [
          AAVE_BB.AAVE[network].POOL_ADDRESS_PROVIDER,
          AAVE_BB.AAVE[network].WETH_GATEWAY,
          AAVE_BB.AAVE[network].REWARD_CONTROLLER,
          ACTION_POOL_SELECT.ADDRESS,
          ACTION_POOL_SELECT.ID,
          LZ_ENDPOINTS[network].ADDRESS,
          LZ_ENDPOINTS[network].ID,
          USDC_ADDRESS,
          UNISWAP_V2_BB.UNISWAP_V2.ROUTER[network],
        ]
      );

      // Deploy lens contract
      const AAVE_LENS = artifacts.require("AaveLens");

      this.aaveLens = await AAVE_LENS.new(
        AAVE_BB.AAVE[network].POOL_ADDRESS_PROVIDER,
        AAVE_BB.AAVE[network].REWARD_CONTROLLER
      );

      await this.aaveVault.initialize(initParams);
      //  Fund actionPool from fork fake account
      await this.actionPool.call({
        value: BigNumber.from(String(ether("10"))),
      });
      this.txOptions = {
        gasLimit: 210000,
        gasPrice: ethers.utils.parseUnits("36", "gwei").toString(),
      };
    });

    describe("Test AAVE VAULT ", function () {
      it("Mock bridge deposit ", async function () {
        const usdcBalance = await this.USDC_AVAX.balanceOf(
          this.actionPool.address
        );
        const wbtcBalance = await this.WBTC_AVAX.balanceOf(
          this.actionPool.address
        );
        const linkBalance = await this.LINK_AVAX.balanceOf(
          this.actionPool.address
        );
        const usdtBalance = await this.USDT_AVAX.balanceOf(
          this.actionPool.address
        );

        const aaveBalance = await this.AAVE_AVAX.balanceOf(
          this.actionPool.address
        );

        const btcbBalance = await this.BTCB_AVAX.balanceOf(
          this.actionPool.address
        );
        await this.USDC_AVAX.connect(this.actionPool).transfer(
          this.aaveVault.address,
          usdcBalance
        );
        await this.WBTC_AVAX.connect(this.actionPool).transfer(
          this.aaveVault.address,
          wbtcBalance
        );
        await this.LINK_AVAX.connect(this.actionPool).transfer(
          this.aaveVault.address,
          linkBalance
        );
        await this.USDT_AVAX.connect(this.actionPool).transfer(
          this.aaveVault.address,
          usdtBalance
        );

        await this.AAVE_AVAX.connect(this.actionPool).transfer(
          this.aaveVault.address,
          aaveBalance
        );

        await this.BTCB_AVAX.connect(this.actionPool).transfer(
          this.aaveVault.address,
          btcbBalance
        );

        this.usdcVaultBalance = await this.USDC_AVAX.balanceOf(
          this.aaveVault.address
        );

        this.wbtcVaultBalance = await this.WBTC_AVAX.balanceOf(
          this.aaveVault.address
        );
        this.linkVaultBalance = await this.LINK_AVAX.balanceOf(
          this.aaveVault.address
        );

        this.wbtcVaultBalance = await this.WBTC_AVAX.balanceOf(
          this.aaveVault.address
        );
        this.linkVaultBalance = await this.LINK_AVAX.balanceOf(
          this.aaveVault.address
        );
        this.usdtVaultBalance = await this.USDT_AVAX.balanceOf(
          this.aaveVault.address
        );
        this.aaveVaultBalance = await this.AAVE_AVAX.balanceOf(
          this.aaveVault.address
        );
        this.btcbVaultbBalance = await this.BTCB_AVAX.balanceOf(
          this.aaveVault.address
        );

        expect(Number(String(this.usdcVaultBalance))).to.be.equal(
          Number(String(usdcBalance))
        );
        expect(Number(String(this.wbtcVaultBalance))).to.be.equal(
          Number(String(wbtcBalance))
        );
        expect(Number(String(this.linkVaultBalance))).to.be.equal(
          Number(String(linkBalance))
        );
        expect(Number(String(this.usdtVaultBalance))).to.be.equal(
          Number(String(usdtBalance))
        );
        expect(Number(String(this.aaveVaultBalance))).to.be.equal(
          Number(String(aaveBalance))
        );
        expect(Number(String(this.btcbVaultbBalance))).to.be.equal(
          Number(String(btcbBalance))
        );
      });

      it("Opens a position in aave ", async function () {
        /** supply USDC **/
        let actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16"],
          [this.USDC_AVAX.address, this.usdcVaultBalance, 0]
        );

        expect(await this.aaveVault.openPosition(actionData))
          .to.emit(this.aaveVault, "OpenPositionEvent")
          .withArgs(this.USDC_AVAX.address, this.usdcVaultBalance);

        /** supply WBTC **/
        actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16"],
          [this.WBTC_AVAX.address, this.wbtcVaultBalance, 0]
        );
        expect(await this.aaveVault.openPosition(actionData))
          .to.emit(this.aaveVault, "OpenPositionEvent")
          .withArgs(this.WBTC_AVAX.address, this.wbtcVaultBalance);

        /** supply LINK **/
        actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16"],
          [this.LINK_AVAX.address, this.linkVaultBalance, 0]
        );

        expect(await this.aaveVault.openPosition(actionData))
          .to.emit(this.aaveVault, "OpenPositionEvent")
          .withArgs(this.LINK_AVAX.address, this.linkVaultBalance);

        /** supply USDT **/
        actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16"],
          [this.USDT_AVAX.address, this.usdtVaultBalance, 0]
        );

        expect(await this.aaveVault.openPosition(actionData))
          .to.emit(this.aaveVault, "OpenPositionEvent")
          .withArgs(this.USDT_AVAX.address, this.usdtVaultBalance);

        /** supply AAVE **/
        actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16"],
          [this.AAVE_AVAX.address, this.aaveVaultBalance, 0]
        );

        expect(await this.aaveVault.openPosition(actionData))
          .to.emit(this.aaveVault, "OpenPositionEvent")
          .withArgs(this.AAVE_AVAX.address, this.aaveVaultBalance);

        /** supply BTCb **/
        actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16"],
          [this.BTCB_AVAX.address, this.btcbVaultbBalance, 0]
        );

        expect(await this.aaveVault.openPosition(actionData))
          .to.emit(this.aaveVault, "OpenPositionEvent")
          .withArgs(this.BTCB_AVAX.address, this.btcbVaultbBalance);

        // Expect to increase user total collateral provided
        const userData = await this.aaveVault.getUserAccountData(
          this.aaveVault.address
        );
        const totalCollateralBase =
          await userData.totalCollateralBase.toString();
        expect(Number(totalCollateralBase)).to.be.above(0);
      });

      it("Set user E-mode in aave ", async function () {
        const eMode = 1;
        const actionData = this.defaultEncoder.encode(["uint8"], [eMode]);
        await this.aaveVault.setUserEMode(actionData, this.txOptions);
        const actualUserEmode = await this.aaveVault.getUserEMode(
          this.aaveVault.address
        );
        expect(eMode).to.be.equal(Number(String(actualUserEmode)));
      });

      it("Sets aave collateral asset type ", async function () {
        const collateralAsset = this.USDC_AVAX.address;
        const actionData = this.defaultEncoder.encode(
          ["address"],
          [collateralAsset]
        );
        // set collateral type
        await this.aaveVault.setCollateralAsset(actionData, this.txOptions);

        // The first bit of the pair indicates if it is being used as collateral by the user,the second bit indicates if it is being borrowed.
        // The corresponding assets are in the same position as getReservesList()
        const reservesList = await this.aaveLens.getReservesList();
        const userConfig = await this.aaveLens.getUserConfiguration(
          this.aaveVault.address
        );
        const assetListIndex = Number(userConfig).toString(2).length / 2;
        // this expects only works on the first borrowing event
        expect(reservesList[assetListIndex - 1]).to.be.equal(collateralAsset);
      });

      it("Borrows 1 FRAX against 8 USDC ", async function () {
        const borrowAmount = String(ether("1"));
        const actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16", "uint16"],
          [FRAX_AVAX, borrowAmount, 2, 0]
        );
        await this.aaveVault.borrow(actionData, this.txOptions);
        const fraxVaultBalance = await this.FRAX_AVAX.balanceOf(
          this.aaveVault.address
        );
        expect(Number(String(fraxVaultBalance))).to.be.equal(
          Number(ether("1"))
        );

        // Expect to fire Open position event
        expect(await this.aaveVault.borrow(actionData))
          .to.emit(this.aaveVault, "BorrowEvent")
          .withArgs(this.FRAX_AVAX.address, Number(ether("1")));
      });

      it("Close position, (withdraw 1 USDC from aave)", async function () {
        const oneUSDC = 100000;
        const actionData = this.defaultEncoder.encode(
          ["address", "uint256"],
          [USDC_AVAX, oneUSDC]
        );

        const totalCollateralBaseB4Withdraw =
          await this.aaveLens.getUserAccountData(this.aaveVault.address);

        // expect ClosePositionEvent
        expect(await this.aaveVault.closePosition(actionData))
          .to.emit(this.aaveVault, "ClosePositionEvent")
          .withArgs(this.USDC_AVAX.address, Number(oneUSDC));

        const totalCollateralBaseAfterWithdraw =
          await this.aaveLens.getUserAccountData(this.aaveVault.address);

        // expect total collateral base amount to decrease after withdraw
        expect(
          Number(String(totalCollateralBaseB4Withdraw.totalCollateralBase))
        ).to.be.above(
          Number(
            String(
              totalCollateralBaseAfterWithdraw.totalCollateralBase.toString()
            )
          )
        );
      });

      it("Repays FRAX loan", async function () {
        const fraxBalance = await this.FRAX_AVAX.balanceOf(
          this.aaveVault.address
        );
        const actionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint16"],
          [FRAX_AVAX, fraxBalance, 2]
        );

        expect(await this.aaveVault.repay(actionData))
          .to.emit(this.aaveVault, "RepayEvent")
          .withArgs(this.FRAX_AVAX.address, Number(fraxBalance));
      });

      it("Withdraws back to Native router", async function () {
        const usdcVaultBalance = await this.USDC_AVAX.balanceOf(
          this.aaveVault.address
        );
        const actionData = this.defaultEncoder.encode(
          ["address", "uint256"],
          [this.USDC_AVAX.address, usdcVaultBalance]
        );
        await this.aaveVault.setNativeRouter(ACTION_POOL);
        await this.aaveVault.backTokensToNative(actionData, this.txOptions);
        const aaveVaultBalanceAfterWithdraw = await this.USDC_AVAX.balanceOf(
          this.aaveVault.address
        );
        expect(Number(String(aaveVaultBalanceAfterWithdraw))).to.be.equal(0);
      });

      it("Claims all vault rewards if any, async function", async function () {
        const rewardAssets = [aWAVAX];
        const actionData = this.defaultEncoder.encode(
          ["address[]", "address"],
          [rewardAssets, this.aaveVault.address]
        );
        expect(await this.aaveVault.claimAllRewards(actionData))
          .to.emit(this.aaveVault, "ClaimedRewardsEvent")
          .withArgs(rewardAssets, this.aaveVault.address);
      });

      it("Swaps tokens for tokens on uniswap v2", async function () {
        const lzData = this.defaultEncoder.encode(
          ["uint256", "uint256", "address[]", "uint256"],
          [DEPOSIT_USDC_AMOUNT, 0, [USDC_AVAX, WAVAX, FRAX_AVAX], 0]
        );
        expect(await this.aaveVault.swap(lzData)).to.emit(
          this.aaveVault,
          "SwapEvent"
        );
        const swapBalance = await this.FRAX_AVAX.balanceOf(
          this.aaveVault.address
        );
        expect(Number(String(swapBalance))).to.be.above(0);
      });
    });
  }
});
