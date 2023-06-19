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
const FRAX_AVAX = "0xD24C2Ad096400B6FBcd2ad8B24E7acBc21A1da64";
const AFRAX_AVAX = "0xc45A479877e1e9Dfe9FcD4056c699575a1045dAA";

const USDC_AVAX = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const LINK_AVAX = "0x5947BB275c521040051D82396192181b413227A3";
const WBTC_AVAX = "0x50b7545627a5162F82A992c33b87aDc75187B218";
const USDT_AVAX = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7";
const AAVE_AVAX = "0x63a72806098Bd3D9520cC43356dD78afe5D386D9";
const BTCB_AVAX = "0x152b9d0FdC40C096757F570A51E494bd4b943E50";

const AAVE_VAULT = artifacts.require("AaveVault");
const AAVE_STRAT = artifacts.require("AaveStrategy");

// eslint-disable-next-line no-undef
contract("Aave Strategy contract", function ([DEPLOYER, ACTION_POOL_LOCAL]) {
  const network = process.argv[process.argv.length - 1];
  if (network === "avalanche") {
    // Deploy Aave BB Vault Contract

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
      this.ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network)
        ? ACTION_POOL.TESTNET
        : ACTION_POOL.MAINNET;
      const USDC_ADDRESS = [
        "fujiavax",
        "polygonmumbai",
        "optimismgoerli",
      ].includes(network)
        ? AAVE_BB.AAVE[network].USDC
        : ASSETS.USDC[network];

      this.aaveVault = await AAVE_VAULT.new();
      const initParams = ethers.utils.defaultAbiCoder.encode(
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
          DEPLOYER, // this.ACTION_POOL_SELECT.ADDRESS,
          this.ACTION_POOL_SELECT.ID,
          LZ_ENDPOINTS[network].ADDRESS,
          LZ_ENDPOINTS[network].ID,
          USDC_ADDRESS,
          UNISWAP_V2_BB.UNISWAP_V2.ROUTER[network],
        ]
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

      this.aaveStrategy = await AAVE_STRAT.new();

      // Deploy Aave Strategy Contract

      const initStratParams = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "address", "address"],
        [
          DEPLOYER, // this.ACTION_POOL_SELECT.ADDRESS,
          this.aaveVault.address, // AAVE_BB.DC_BUILDING_BLOCK[network],
          UNISWAP_V2_BB.UNISWAP_V2.ROUTER[network],
          AAVE_BB.AAVE[network].POOL_ADDRESS_PROVIDER,
        ]
      );
      await this.aaveStrategy.initialize(initStratParams);
      this.investAmount = BigNumber.from("10000000");

      // set Aave strategy in BB
      await this.aaveVault.setAaveStrategy(this.aaveStrategy.address);
    });

    describe("Test AAVE Strategy ", function () {
      it("Mock bridge deposit to Strategy contract", async function () {
        await this.USDC_AVAX.connect(this.actionPool).transfer(
          this.aaveStrategy.address,
          this.investAmount
        );
        this.usdcStrategyBalance = await this.USDC_AVAX.balanceOf(
          this.aaveStrategy.address
        );
        expect(Number(String(this.usdcStrategyBalance))).to.be.equal(
          Number(String(this.investAmount))
        );
      });

      it("Swaps tokens for tokens on uniswap v2", async function () {
        const actionData = ethers.utils.defaultAbiCoder.encode(
          ["uint256", "uint256", "address[]", "uint256"],
          [this.investAmount, 0, [USDC_AVAX, WAVAX, FRAX_AVAX], 0]
        );

        // Swap
        expect(await this.aaveStrategy.swap(actionData)).to.emit(
          this.aaveStrategy,
          "SwapEvent"
        );
        const swapBalance = await this.FRAX_AVAX.balanceOf(
          this.aaveStrategy.address
        );
        expect(Number(String(swapBalance))).to.be.above(0);
      });

      it("Mock bridge deposit to Vault contract", async function () {
        this.investAmount = BigNumber.from("33175492");
        await this.USDC_AVAX.connect(this.actionPool).transfer(
          this.aaveVault.address,
          this.investAmount
        );
        this.usdcVaultBalance = await this.USDC_AVAX.balanceOf(
          this.aaveVault.address
        );
        expect(Number(String(this.usdcVaultBalance))).to.be.equal(
          Number(String(this.investAmount))
        );
      });

      it("Executes a margin short", async function () {
        const MarginShortParams = ethers.utils.defaultAbiCoder.encode(
          [
            {
              type: "tuple",
              name: "MarginShort",
              components: [
                { name: "supplyAsset", type: "address" },
                { name: "borrowAsset", type: "address" },
                { name: "supplyAmount", type: "uint256" },
                { name: "tradeOutAmount", type: "uint256" },
                { name: "tradeDeadline", type: "uint256" },
                { name: "referralCode", type: "uint16" },
                { name: "borrowRate", type: "uint16" },
                { name: "path", type: "address[]" },
              ],
            },
          ],
          [
            {
              supplyAsset: USDC_AVAX,
              borrowAsset: LINK_AVAX,
              supplyAmount: 33175492,
              tradeOutAmount: 0,
              tradeDeadline: 0,
              referralCode: 0,
              borrowRate: 2,
              path: [LINK_AVAX, WAVAX, USDC_AVAX],
            },
          ]
        );

        // Execute marginShort
        expect(await this.aaveStrategy.marginShort(MarginShortParams))
          .to.emit(this.aaveVault, "OpenPositionEvent")
          .to.emit(this.aaveVault, "BorrowEvent")
          .to.emit(this.aaveVault, "SwapEvent")
          .to.emit(this.aaveVault, "OpenPositionEvent");
      });
    });
  }
});
