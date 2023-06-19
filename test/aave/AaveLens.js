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

    describe("Test AAVE LENS ", function () {
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
        const userData = await this.aaveLens.getUserAccountData(
          this.aaveVault.address
        );
        const totalCollateralBase =
          await userData.totalCollateralBase.toString();
        expect(Number(totalCollateralBase)).to.be.above(0);
      });

      it("Gets getAllUserRewards", async function () {
        // checks eligible distribution for assets but returns in terms of WAVAX
        const userRewards = await this.aaveLens.getAllUserRewards(
          [AUSDC_AVAX, AFRAX_AVAX, aWAVAX],
          this.aaveVault.address
        );
        // expect the vault to a positive amount of rewards on WAVAX
        expect(userRewards[0].toString()).to.be.equal(WAVAX);
        expect(Number(userRewards[1].toString())).to.be.above(0);
      });

      it("Gets user Emode", async function () {
        const actionData = this.defaultEncoder.encode(["uint8"], [1]);
        await this.aaveVault.setUserEMode(actionData);
        const eMode = await this.aaveLens.getUserEMode(this.aaveVault.address);
        // by now we would have set emode to 1 already
        expect(Number(eMode)).to.be.above(0);
      });

      it("Gets AAVEs user Configuration", async function () {
        // Returns the configuration of the user across all the reserves.
        const userConfig = await this.aaveLens.getUserConfiguration(
          this.aaveVault.address
        );
        // expect the user to set a collateral type in config:
        // ref : https://docs.aave.com/developers/core-contracts/pool
        expect(Number(userConfig.data)).to.be.above(0);
      });

      it("Gets AAVEs reserve list", async function () {
        const aaveReserveList = await this.aaveLens.getReservesList();
        // expect the aave reserve list to be populated with supported assets
        expect(Number(aaveReserveList.length)).to.be.above(1);
      });

      it("Gets AAVEs userAccountData", async function () {
        const userAccountData = await this.aaveLens.getUserAccountData(
          this.aaveVault.address
        );
        // by now we would have borrow assets already
        expect(Number(userAccountData.healthFactor)).to.be.above(0);
      });

      it("Gets AAVEs Position Sizes ", async function () {
        const assets = [
          USDC_AVAX,
          LINK_AVAX,
          WBTC_AVAX,
          USDT_AVAX,
          AAVE_AVAX,
          BTCB_AVAX,
        ];

        // initial test account aave-supplied investments
        const investments = [
          { asset: "usdc", value: BigNumber.from("30934378") },
          { asset: "link", value: BigNumber.from("2774093466729411855") },
          { asset: "wbtc", value: BigNumber.from("126347") },
          { asset: "usdt", value: BigNumber.from("11867571") },
          { asset: "aave", value: BigNumber.from("321107901514875326") },
          { asset: "btcb", value: BigNumber.from("69645") },
        ];

        const userAccountData = await this.aaveLens.getPositionSizes(
          this.aaveVault.address,
          assets
        );

        // aave position size to be at least the supplied amount
        expect(Number(userAccountData[0])).to.be.at.least(
          Number(String(investments[0].value))
        );
        expect(Number(userAccountData[1])).to.be.at.least(
          Number(String(investments[1].value))
        );
        expect(Number(userAccountData[2])).to.be.at.least(
          Number(String(investments[2].value))
        );
        expect(Number(userAccountData[3])).to.be.at.least(
          Number(String(investments[3].value))
        );
        expect(Number(userAccountData[4])).to.be.at.least(
          Number(String(investments[4].value))
        );
        expect(Number(userAccountData[5])).to.be.at.least(
          Number(String(investments[5].value))
        );
      });

      it("Gets AAVEs Position Sizes In USDC", async function () {
        const assets = [
          USDC_AVAX,
          LINK_AVAX,
          WBTC_AVAX,
          USDT_AVAX,
          AAVE_AVAX,
          BTCB_AVAX,
        ];
        const usdcPositions = await this.aaveLens.getPositionSizesInUSDC(
          this.aaveVault.address,
          assets
        );
        const userData = await this.aaveLens.getUserAccountData(
          this.aaveVault.address
        );
        const totalCollateral = usdcPositions.reduce(
          (a, b) => Number(a) + Number(b),
          0
        );
        expect(Number(totalCollateral)).to.be.at.least(
          Number(userData.totalCollateralBase.toString())
        );
      });
    });
  }
});
