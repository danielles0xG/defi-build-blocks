const { ether } = require("@openzeppelin/test-helpers");
const { BigNumber } = require("ethers");
const { ethers, artifacts } = require("hardhat");
const { expect } = require("chai");

const {
  UNISWAP_V3_BB,
  ACTION_POOL,
  LZ_ENDPOINTS,
  ASSETS,
} = require("../../config/addresses.json");
const SWAPPER_V3 = artifacts.require("DcSwapperV3");

// eslint-disable-next-line no-undef
contract("DcSwapperV3  Building block", async function ([ACTION_POOL_LOCAL]) {
  const network = process.argv[process.argv.length - 1];
  const DEPOSIT_USDC_AMOUNT = BigNumber.from("5000000");
  const MaxUint256 = ethers.constants.MaxUint256;

  if (network === "optimism") {
    before(async function () {
      const signers = await ethers.getSigners();
      this.deployer = signers[0];
      this.actionPool = signers[1];
      this.swapperV3 = await SWAPPER_V3.new();
      this.encoder = new ethers.utils.Interface(this.swapperV3.abi);
      this.defaultEncoder = ethers.utils.defaultAbiCoder;

      this.USDC_OPTIMISM = await ethers.getContractAt(
        "ERC20Mock",
        ASSETS.USDC[network]
      );
      this.DAI_OPTIMISM = await ethers.getContractAt(
        "ERC20Mock",
        ASSETS.DAI[network]
      );

      const initParams = this.defaultEncoder.encode(
        [
          "address",
          "address",
          "address",
          "address",
          "address",
          "uint16",
          "uint16",
          "uint24[]",
        ],
        [
          UNISWAP_V3_BB.UNISWAP_V3.ROUTER[network],
          UNISWAP_V3_BB.UNISWAP_V3.QUOTER[network],
          ACTION_POOL.MAINNET.ADDRESS,
          LZ_ENDPOINTS[network].ADDRESS,
          ASSETS.USDC[network],
          ACTION_POOL.MAINNET.ID,
          LZ_ENDPOINTS[network].ID,
          [100, 500, 3000, 10000],
        ]
      );

      await this.swapperV3.initialize(initParams);
      this.txOptions = {
        gasLimit: 210000,
        gasPrice: ethers.utils.parseUnits("27", "gwei").toString(),
      };
      await this.actionPool.call({
        value: BigNumber.from(String(ether("1"))),
      });
    });

    describe("Test uniswap v3 integration", function () {
      it("Deposits into contract", async function () {
        await this.USDC_OPTIMISM.connect(this.actionPool).transfer(
          this.swapperV3.address,
          Number(DEPOSIT_USDC_AMOUNT),
          this.txOptions
        );
        const balance = await this.USDC_OPTIMISM.balanceOf(
          this.swapperV3.address
        );
        expect(Number(String(balance))).to.be.above(0);
      });

      it("Set Dex", async function () {
        const lzData = this.defaultEncoder.encode(
          ["address"],
          [UNISWAP_V3_BB.UNISWAP_V3.ROUTER[network]]
        );
        await this.swapperV3.setDex(lzData, { from: ACTION_POOL_LOCAL });
        const amm = await this.swapperV3.amm();
        expect(amm).to.be.equal(UNISWAP_V3_BB.UNISWAP_V3.ROUTER[network]);
      });

      it("Set Quoter", async function () {
        const lzData = this.defaultEncoder.encode(
          ["address"],
          [UNISWAP_V3_BB.UNISWAP_V3.QUOTER[network]]
        );
        await this.swapperV3.setQuoter(lzData, { from: ACTION_POOL_LOCAL });
        const quoter = await this.swapperV3.quoter();
        expect(quoter).to.be.equal(UNISWAP_V3_BB.UNISWAP_V3.QUOTER[network]);
      });

      it("Set Fee levels", async function () {
        const lzData = this.defaultEncoder.encode(
          ["uint24[]"],
          [[100, 500, 3000, 10000]]
        );
        await this.swapperV3.setFeesLevels(lzData);
        const fees = await this.swapperV3.fees(0);
        expect(Number(String(fees))).to.be.equal(100);
      });

      it("Swaps USDC/DAI - TOKENS FOR TOKENS ", async function () {
        const usdcBalance = await this.USDC_OPTIMISM.balanceOf(
          this.swapperV3.address
        );
        const lzActionData = this.defaultEncoder.encode(
          ["address", "address", "uint256", "address"],
          [
            ASSETS.USDC[network],
            ASSETS.DAI[network],
            usdcBalance,
            ACTION_POOL_LOCAL,
          ]
        );

        await this.USDC_OPTIMISM.connect(this.actionPool).approve(
          this.swapperV3.address,
          MaxUint256
        );
        // expect tokenOut balance to increase
        await this.swapperV3.swap(lzActionData, this.txOptions);
        const tokenOutBalance = await this.DAI_OPTIMISM.balanceOf(
          ACTION_POOL_LOCAL
        );
        expect(Number(String(tokenOutBalance))).to.be.above(0);
      });

      /**
       * View methods
       */

      it("Test if Tokens are Supported", async function () {
        const bridgeToken = ASSETS.USDC[network];
        const tokens = [ASSETS.DAI[network]];
        const supported = await this.swapperV3.isTokensSupported(
          bridgeToken,
          tokens
        );
        expect(supported[0]).to.be.equal(true);
      });

      it("Test if Pairs are Supported", async function () {
        const tokens = [[ASSETS.USDC[network], ASSETS.DAI[network]]];
        const supported = await this.swapperV3.isPairsSupported(tokens);
        expect(supported[0]).to.be.equal(true);
      });

      it("Gets Quote", async function () {
        const lzData = this.defaultEncoder.encode(
          ["address", "address", "uint256"],
          [
            ASSETS.DAI[network],
            ASSETS.USDC[network],
            BigNumber.from(String(ether("1"))),
          ]
        );
        const txQuote = await this.swapperV3.quote(lzData);
        expect(txQuote.receipt.status).to.be.equal(true);
      });
    });
  }
});
