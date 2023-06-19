const { ether } = require("@openzeppelin/test-helpers");
const { BigNumber } = require("ethers");
const { ethers, artifacts } = require("hardhat");
const { expect } = require("chai");
const {
  GMX_BB,
  ACTION_POOL,
  LZ_ENDPOINTS,
  ASSETS,
} = require("../../config/addresses.json");

const FS_GLP_AVAX = "0x9e295B5B976a184B14aD8cd72413aD846C299660";

const sGMXAVAX = "0x2bD10f8E93B3669b6d42E74eEedC65dd1B0a1342";
const USDC_AVAX = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const USDCE_AVAX = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664";
const BTC_AVAX = "0x152b9d0FdC40C096757F570A51E494bd4b943E50";
const WETH_AVAX = "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB";
const WBTC_AVAX = "0x50b7545627a5162F82A992c33b87aDc75187B218";
const WAVAX = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";

// not calculate on gmx index but exists into glp vault
// const MIM_AVAX = "0x130966628846BFd36ff31a822705796e8cb8C18D";

const GMX_VAULT = artifacts.require("GmxVault");
/*
    Test for Mainnet Avalanche fork
*/

// eslint-disable-next-line no-undef
contract("GMX BB - Vault", function ([DEPLOYER, ACTION_POOL_LOCAL]) {
  const network = process.argv[process.argv.length - 1];
  const DEPOSIT_USDC_AMOUNT = BigNumber.from("2000000");
  console.log("DEPOSIT_USDC_AMOUNT: ", DEPOSIT_USDC_AMOUNT);

  if (network === "avalanche") {
    before(async function () {
      const signers = await ethers.getSigners();
      this.deployer = signers[0];
      this.actionPool = signers[1];

      // Tokens
      this.WETH_AVAX = await ethers.getContractAt("IWETHMock", WETH_AVAX);
      this.FS_GLP = await ethers.getContractAt("ERC20Mock", FS_GLP_AVAX);
      this.sGMX = await ethers.getContractAt("ERC20Mock", sGMXAVAX);
      this.USDC_AVAX = await ethers.getContractAt("ERC20Mock", USDC_AVAX);
      this.defaultEncoder = ethers.utils.defaultAbiCoder;

      this.GmxVault = await GMX_VAULT.new();
      const initParams = this.defaultEncoder.encode(
        [
          "address",
          "address",
          "address",
          "uint16",
          "address",
          "uint16",
          "address",
        ],
        [
          GMX_BB.GMX.VAULT[network],
          GMX_BB.GMX.REWARD_ROUTER[network],
          ACTION_POOL.MAINNET.ADDRESS,
          ACTION_POOL.MAINNET.ID,
          LZ_ENDPOINTS[network].ADDRESS,
          LZ_ENDPOINTS[network].ID,
          ASSETS.USDC[network],
        ]
      );

      // params
      await this.GmxVault.initialize(initParams);
      await this.actionPool.call({
        value: BigNumber.from(String(ether("10"))),
      }); // seed tx funds to actionPool from fork fake account (DEPLOYER)
      this.txOptions = {
        gasLimit: 2100000,
        gasPrice: ethers.utils.parseUnits("26", "gwei").toString(),
      };
    });

    describe("Gmx vault contract buy/sell actions testing", function () {
      it("Deposits into BB", async function () {
        // Trasnfer funds to Building block contract
        await this.USDC_AVAX.connect(this.actionPool).transfer(
          this.GmxVault.address,
          DEPOSIT_USDC_AMOUNT,
          this.txOptions
        );
        const vaultUSDCBalance = await this.USDC_AVAX.balanceOf(
          this.GmxVault.address
        );
        expect(Number(String(vaultUSDCBalance))).to.be.equal(
          Number(String(DEPOSIT_USDC_AMOUNT))
        );
      });

      it("Buys GLP with USDC", async function () {
        await this.USDC_AVAX.balanceOf(this.GmxVault.address);

        const lzActionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint256", "uint256"],
          [USDC_AVAX, DEPOSIT_USDC_AMOUNT, 0, 0]
        );

        // Buy Glp
        await this.GmxVault.buyGLP(lzActionData);
        const vaultGLPBalance = await this.FS_GLP.balanceOf(
          this.GmxVault.address
        );
        expect(Number(String(vaultGLPBalance))).to.be.above(0);
      });

      // 15min AVAX mainnet cool down period to sell after buying GLP
      it("Sells GLP for USDC", async function () {
        const vaultGlpBalance = await this.FS_GLP.balanceOf(
          this.GmxVault.address
        );
        const lzActionData = this.defaultEncoder.encode(
          ["address", "uint256", "uint256"],
          [this.USDC_AVAX.address, vaultGlpBalance, 0]
        );
        expect(Number(String(vaultGlpBalance))).to.be.above(0);
        expect(
          await this.GmxVault.sellGLP(lzActionData, this.txOptions)
        ).to.emit(this.GmxVault, "SellingEvent");
        const vaultGlpBalanceAfter = await this.FS_GLP.balanceOf(
          this.GmxVault.address
        );
        expect(Number(String(vaultGlpBalanceAfter))).to.be.equal(0);
      });

      it("Withdraws back to Native router", async function () {
        const lzActionData = this.defaultEncoder.encode(
          ["address", "uint256"],
          [
            this.USDC_AVAX.address,
            await this.USDC_AVAX.balanceOf(this.GmxVault.address),
          ]
        );
        await this.GmxVault.setNativeRouter(ACTION_POOL_LOCAL);

        // Withdraw
        await this.GmxVault.backTokensToNative(lzActionData, this.txOptions);
        const gmxVaultAfterWithdraw = await this.USDC_AVAX.balanceOf(
          this.GmxVault.address
        );
        expect(Number(String(gmxVaultAfterWithdraw))).to.be.equal(0);
      });

      it("Claim rewards", async function () {
        const lzActionData = this.defaultEncoder.encode(
          ["bool", "bool", "bool", "bool", "bool", "bool", "bool"],
          [true, true, true, true, true, true, true]
        );
        // Claim glp rewards
        await this.GmxVault.claimRewards(lzActionData, this.txOptions);
        const vaultGlpBalance = await this.FS_GLP.balanceOf(
          this.GmxVault.address
        );
        const sGMXbalance = await this.sGMX.balanceOf(this.GmxVault.address);
        expect(Number(String(vaultGlpBalance))).to.be.above(0);
        expect(Number(String(sGMXbalance))).to.be.above(0);
      });

      it("Get pool weight in USD ", async function () {
        const glpAssets = [
          WAVAX,
          WETH_AVAX,
          BTC_AVAX,
          WBTC_AVAX,
          USDC_AVAX,
          USDCE_AVAX,
          // MIM_AVAX
        ];
        const weights = await this.GmxVault.getWeights(glpAssets);
        weights.forEach((aum, idx) => {
          console.log(idx, ":", String(aum));
        });
        expect(Number(String(weights.length))).to.be.above(0);
      });
    });
  }
});
