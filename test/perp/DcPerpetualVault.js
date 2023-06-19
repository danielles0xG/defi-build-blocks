const { ether } = require("@openzeppelin/test-helpers");
const { BigNumber, artifacts } = require("ethers");
const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  PERP_BB,
  ACTION_POOL,
  ASSETS,
  LZ_ENDPOINTS,
} = require("../../config/addresses.json");
// eslint-disable-next-line no-undef
contract("Perpetual BB - Vault", function () {
  const network = process.argv[process.argv.length - 1];
  const DEPOSIT_USDC_AMOUNT = BigNumber.from("1000000");

  if (network === "optimism") {
    before(async function () {
      const signers = await ethers.getSigners();
      this.deployer = signers[0];
      this.actionPool = signers[1];

      const DC_PERPETUAL_VAULT = artifacts.require("DcPerpetualVault");
      this.USDC = await ethers.getContractAt(
        "ERC20Mock",
        "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
      );
      console.log("ASSETS.USDC[network]", ASSETS.USDC[network]);
      this.defaultEncoder = ethers.utils.defaultAbiCoder;
      const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network)
        ? ACTION_POOL.TESTNET
        : ACTION_POOL.MAINNET;
      this.DcPerpetualVault = await DC_PERPETUAL_VAULT.new();
      const initParams = this.defaultEncoder.encode(
        [
          "address",
          "address",
          "address",
          "address",
          "address",
          "address",
          "address",
          "uint16",
          "uint16",
          "uint160",
        ],
        [
          LZ_ENDPOINTS[network].ADDRESS,
          ACTION_POOL_SELECT.ADDRESS,
          PERP_BB.PERP_PROTOCOL.CLEARING_HOUSE[network],
          PERP_BB.PERP_PROTOCOL.VAULT[network],
          ASSETS.USDC[network],
          ASSETS.WETH[network],
          ACTION_POOL_SELECT.ID,
          LZ_ENDPOINTS[network].ID,
          300,
        ]
      );
      await this.actionPool.call({
        value: BigNumber.from(String(ether("10"))),
      });
      this.DcPerpetualVault.initialize(initParams);

      this.txOptions = {
        gasLimit: 210000,
        gasPrice: ethers.utils.parseUnits("26", "gwei").toString(),
      };
    });
    describe("Perpetual vault contract", function () {
      it("Transfer USDC funds to BB", async function () {
        await this.USDC.connect(this.actionPool).transfer(
          this.DcPerpetualVault.address,
          DEPOSIT_USDC_AMOUNT,
          this.txOptions
        );
        const vaultUSDCBalance = await this.USDC.balanceOf(
          this.DcPerpetualVault.address
        );
        expect(Number(String(vaultUSDCBalance))).to.be.equal(
          Number(String(DEPOSIT_USDC_AMOUNT))
        );
      });

      it("Direct deposit to Perpetual Vault", async function () {
        const lzActionData = this.defaultEncoder.encode(["uint256"], [1000000]);
        expect(
          await this.DcPerpetualVault.directDepositToVault(
            lzActionData,
            this.txOptions
          )
        ).to.emit(this.GmxVault, "USDCDeposited");
      });

      it("Emergency closes all positions (withdraw all collateral)", async function () {
        expect(
          await this.DcPerpetualVault.emergencyClose(this.txOptions)
        ).to.emit(this.GmxVault, "EmergencyClosed");
      });

      it("Opens perpetual SHORT position", async function () {
        const lzActionData = this.defaultEncoder.encode(["int256"], [-5000000]);
        expect(
          await this.DcPerpetualVault.adjustPosition(
            lzActionData,
            this.txOptions
          )
        ).to.emit(this.GmxVault, "PositionAdjusted");
      });

      it("Opens perpetual LONG  position", async function () {
        const lzActionData = this.defaultEncoder.encode(["int256"], [5000000]);
        expect(
          await this.DcPerpetualVault.adjustPosition(
            lzActionData,
            this.txOptions
          )
        ).to.emit(this.GmxVault, "SellingEvent");
      });

      /** Views */

      it("Get account value", async function () {
        const accountValue = this.DcPerpetualVault.accountValue(
          this.actionPool.address,
          this.txOptions
        );
        expect(Number(String(accountValue))).to.be.greaterThan(0);
      });

      it("Get account Free collateral", async function () {
        const freeCollateral = this.DcPerpetualVault.getFreeCollateral(
          this.actionPool.address,
          this.txOptions
        );
        expect(Number(String(freeCollateral))).to.be.greaterThan(0);
      });

      it("Get price of native strategy token (vToken)", async function () {
        const price = this.DcPerpetualVault.getNativeStrategyTokenPrice();
        expect(Number(String(price))).to.be.greaterThan(0);
      });

      it("Get USDC total strategy value", async function () {
        const value = this.DcPerpetualVault.getTotalUSDCValue();
        expect(Number(String(value))).to.be.greaterThan(0);
      });

      it("Get current funding rate", async function () {
        const value = this.DcPerpetualVault.getCurrentFundingRate();
        expect(Number(String(value))).to.be.greaterThan(0);
      });
    });
  }
});
