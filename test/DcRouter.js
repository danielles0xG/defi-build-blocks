const { expect } = require("chai");
const { ether } = require("@openzeppelin/test-helpers");
const { artifacts, ethers } = require("hardhat");
const BB_CONTRACT = require("../artifacts/contracts/DcRouter.sol/DcRouter.json");

const POOL = artifacts.require("ActionPoolDcRouter");
const VAULT = artifacts.require("BBMock");
const DCROUTER = artifacts.require("DcRouterMock");
const DECODER = artifacts.require("DecodeHelper");
const USDC = artifacts.require("USDCMock");
const BRIDGE = artifacts.require("StargateMock");

// eslint-disable-next-line no-undef
contract("DcRouterMock", function ([wallet1, wallet2, relayer, lzEndpoint]) {
  before(async function () {
    this.defaultEncoder = ethers.utils.defaultAbiCoder;
    this.encoder = new ethers.utils.Interface(BB_CONTRACT.abi);
    this.usdc = await USDC.new({ from: wallet1 });
    this.usdt = await USDC.new({ from: wallet1 });
    this.pool = await POOL.new(relayer, lzEndpoint, 1, relayer, {
      from: relayer,
    });
    await this.pool.setRelayer(relayer, { from: relayer });
    this.dcRouter = await DCROUTER.new(
      relayer,
      1,
      lzEndpoint,
      this.usdc.address,
      this.pool.address,
      1,
      { from: relayer }
    );
    await this.dcRouter.setTrustedRemoteAddress(1, this.dcRouter.address, {
      from: relayer,
    });
    this.perpImpl = await VAULT.new(this.pool.address, { from: wallet1 });
    this.aaveImpl = await VAULT.new(this.pool.address, { from: wallet1 });
    this.decoder = await DECODER.new({ from: wallet1 });
    await this.dcRouter.setTrustedRemoteAddress(1, this.dcRouter.address, {
      from: relayer,
    });
    this.sgBridgeMock = await BRIDGE.new({ from: relayer });
    this.bbMock = await VAULT.new({ from: relayer });
    const bbMockParams = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint16"],
      [ethers.constants.AddressZero, this.sgBridgeMock.address, 0]
    );
    await this.bbMock.initialize(bbMockParams, { from: relayer });
  });
  describe("ActionPool directly calls", function () {
    it("initial params ", async function () {
      const nativeChain = await this.dcRouter.getNativeChainId();
      expect(nativeChain.toString()).to.equal("1");

      const treasurer = await this.pool.getDeCommasTreasurer();
      expect(treasurer.toString()).to.equal(relayer);
    });
    it("set Stable Token", async function () {
      const tokenBefore = await this.dcRouter.getCurrentStableToken();
      expect(tokenBefore.toString()).to.equal(this.usdc.address);
      await this.dcRouter.setStableMock(
        1,
        this.usdt.address,
        1,
        this.dcRouter.address
      );
      const tokenAfter = await this.dcRouter.getCurrentStableToken();
      expect(tokenAfter.toString()).to.equal(this.usdt.address);
    });
    it("approve withdraw", async function () {
      await this.usdt.mint(wallet1, 100000000, { from: wallet1 });
      await this.usdt.approve(this.dcRouter.address, 100000000, {
        from: wallet1,
      });
      await this.dcRouter.deposit(2, 10000000, { from: wallet1 });
      await this.dcRouter.initiateWithdraw(2, 10000000, { from: wallet1 });
      await this.dcRouter.approveWithdrawMock(
        1,
        ether("1"),
        2,
        1,
        this.dcRouter.address
      );
    });
    it("cancel withdraw", async function () {
      await this.usdt.mint(wallet2, 100000000, { from: wallet2 });
      await this.usdt.approve(this.dcRouter.address, 100000000, {
        from: wallet2,
      });
      await this.dcRouter.deposit(8, 10000000, { from: wallet2 });
      await this.dcRouter.initiateWithdraw(8, 10000000, { from: wallet2 });

      const pendingUserWithdrawal = await this.dcRouter.pendingWithdrawalsById(
        8,
        1
      );
      expect(pendingUserWithdrawal.amount.toString()).to.equal("10000000");
      let totalPendingWithdrawal =
        await this.dcRouter.pendingStrategyWithdrawals(8);
      expect(totalPendingWithdrawal.toString()).to.equal("10000000");
      await this.dcRouter.cancelWithdrawMock(1, 8, 1, this.dcRouter.address);
      totalPendingWithdrawal = await this.dcRouter.pendingStrategyWithdrawals(
        8
      );
      expect(totalPendingWithdrawal.toString()).to.equal("0");
    });
    it("getters ", async function () {
      const treasurerAddressCheck = (
        await this.dcRouter.getDeCommasTreasurer()
      ).toString();
      expect(treasurerAddressCheck.toString()).to.equal(relayer);
    });
    it("lost tokens ", async function () {
      await this.usdt.mint(this.dcRouter.address, 100000000, { from: wallet2 });
      await this.dcRouter.pullOutLossERC20(this.usdt.address);
    });
    it("native bridge tokens ", async function () {
      await this.usdt.mint(wallet1, 100000000, { from: wallet2 });
      await this.usdt.approve(this.dcRouter.address, 200000000, {
        from: wallet1,
      });
      await this.dcRouter.deposit(666, 100000000, { from: wallet1 });
      await this.decoder.dataForVault(this.sgBridgeMock.address);
      const lzActionData = this.encoder.encodeFunctionData(
        "setBridge(address)",
        [this.sgBridgeMock.address]
      );
      await this.pool.performToNative(lzActionData, this.dcRouter.address, 0, {
        from: relayer,
      });
      await this.dcRouter.setBridge(this.sgBridgeMock.address, {
        from: relayer,
      });

      const nativeBridge = await this.dcRouter.getNativeSgBridge();
      expect(nativeBridge.toString()).to.equal(this.sgBridgeMock.address);

      await this.pool.bridgeToNative(
        this.dcRouter.address,
        this.usdt.address,
        100000000,
        1,
        this.perpImpl.address,
        this.usdc.address,
        { value: ether("25"), from: relayer }
      );
      await this.dcRouter.withdrawLostETH();
    });
  });
  describe("Router deposit", function () {
    it("BBMock tvl initial", async function () {
      const tvl = await this.bbMock.getTvlMock();
      expect(tvl.toString()).to.equal("0");
    });
    it("Router deposit", async function () {
      const pendingDeposit = await this.dcRouter.pendingStrategyDeposits(100);
      expect(pendingDeposit.toString()).to.equal("0");
      await this.usdt.mint(wallet1, 1000000000, { from: wallet1 });
      await this.usdt.approve(this.dcRouter.address, 10000000000000, {
        from: wallet1,
      });
      await this.dcRouter.deposit(100, 100000000, { from: wallet1 });
      const pendingDepositRequest = (
        await this.dcRouter.pendingDepositsById(100, 1)
      ).amount;
      expect(pendingDepositRequest.toString()).to.equal("100000000");
    });
    it("Transfer deposits", async function () {
      const actionData = this.defaultEncoder.encode(
        [
          "uint16[]",
          "address[]",
          "uint256[]",
          "address[]",
          "uint256",
          "uint256",
        ],
        [
          [1], // some mock lzId
          [this.bbMock.address], // receiver
          [100000000], // transfer 100 usdt
          [this.usdt.address], // destination token
          100, // strategyId
          0, // tvl
        ]
      );
      const lzActionData = this.encoder.encodeFunctionData(
        "transferDeposits(bytes)",
        [actionData]
      );

      await this.pool.performToNative(
        lzActionData,
        this.dcRouter.address,
        100,
        { from: relayer }
      );

      const deposited = await this.dcRouter.userPosition(wallet1, 100);
      expect(deposited.deposit.toString()).to.equal("100000000");
      expect(deposited.shares.toString()).to.equal("100000000"); // shares 1:1
    });

    it("Shares calculation", async function () {
      await this.dcRouter.deposit(100, 100000000, { from: wallet1 });
      const actionData = this.defaultEncoder.encode(
        [
          "uint16[]",
          "address[]",
          "uint256[]",
          "address[]",
          "uint256",
          "uint256",
        ],
        [
          [1], // some mock lzId
          [this.bbMock.address], // receiver
          [100000000], // transfer 100 usdt
          [this.usdt.address], // destination token
          100, // strategyId
          200000000, // tvl
        ]
      );
      const lzActionData = this.encoder.encodeFunctionData(
        "transferDeposits(bytes)",
        [actionData]
      );

      await this.pool.performToNative(
        lzActionData,
        this.dcRouter.address,
        100,
        { from: relayer }
      );

      const deposited = await this.dcRouter.userPosition(wallet1, 100);
      expect(deposited.deposit.toString()).to.equal("200000000");
      expect(deposited.shares.toString()).to.equal("150000000");
    });
  });
});
