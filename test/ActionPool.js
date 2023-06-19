const { ether } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");
const { artifacts, ethers } = require("hardhat");
const BB_CONTRACT = require("../artifacts/contracts/DcRouter.sol/DcRouter.json");

const POOL = artifacts.require("ActionPoolDcRouter");
const VAULT = artifacts.require("BBMock");
const DCROUTER = artifacts.require("DcRouterMock");
const USDC = artifacts.require("USDCMock");
const BRIDGE = artifacts.require("StargateMock");
const LZENDPOINT = artifacts.require("LZEndpointMock");
const FABRIC = artifacts.require("FabricMock");
const STRATEGY_REGISTRY = artifacts.require("StrategyRegistry");

// eslint-disable-next-line no-undef
contract("ActionPool", function ([wallet1, wallet2, relayer]) {
  before(async function () {
    this.defaultEncoder = ethers.utils.defaultAbiCoder;
    this.encoder = new ethers.utils.Interface(BB_CONTRACT.abi);

    this.lzEndpoint = await LZENDPOINT.new();
    this.usdc = await USDC.new({ from: wallet1 });
    this.usdt = await USDC.new({ from: wallet1 });
    this.pool = await POOL.new(relayer, this.lzEndpoint.address, 2, relayer, {
      from: relayer,
    });
    await this.pool.setRelayer(relayer, { from: relayer });
    this.registry = await STRATEGY_REGISTRY.new(
      1,
      0x1,
      2,
      this.lzEndpoint.address,
      relayer,
      1,
      { from: wallet1 }
    );
    this.bbfabric = await FABRIC.new(
      1,
      this.lzEndpoint.address,
      this.pool.address,
      1,
      1,
      this.registry.address,
      {
        from: relayer,
      }
    );
    await this.registry.setTrustedRemoteAddress(1, this.bbfabric.address, {
      from: wallet1,
    });
    this.dcRouter = await DCROUTER.new(
      relayer,
      1,
      this.lzEndpoint.address,
      this.usdc.address,
      this.pool.address,
      1,
      { from: relayer }
    );
    await this.pool.setTrustedRemoteAddress(1, this.dcRouter.address, {
      from: relayer,
    });
    this.perpImpl = await VAULT.new(this.pool.address, { from: wallet1 });
    this.aaveImpl = await VAULT.new(this.pool.address, { from: wallet1 });
    this.sgBridgeMock = await BRIDGE.new({ from: relayer });
  });

  describe("ActionPool pool LZ special calls", function () {
    it("initial params ", async function () {
      const nativeChain = await this.pool.getNativeChainId();
      expect(nativeChain.toString()).to.equal("2");

      const treasurer = await this.pool.getDeCommasTreasurer();
      expect(treasurer.toString()).to.equal(relayer);
    });
    it("direct set bridge ", async function () {
      this.FakePool = await POOL.new(
        relayer,
        this.lzEndpoint.address,
        1111,
        relayer,
        { from: relayer }
      );
    });
    it("trusted remote", async function () {
      await this.pool.setTrustedRemoteAddress(1, wallet2, {
        from: relayer,
      });
      const lzActionData = this.encoder.encodeFunctionData(
        "setBridge(address)",
        [this.sgBridgeMock.address]
      );
      await this.pool.performToNative(lzActionData, this.dcRouter.address, 0, {
        from: relayer,
      });
    });
  });
  describe("ActionPool pool LZ native calls", function () {
    it("approve withdraw", async function () {
      await this.usdc.mint(wallet1, 100000000, { from: wallet1 });
      await this.usdc.approve(this.dcRouter.address, 100000000, {
        from: wallet1,
      });
      await this.pool.setTrustedRemoteAddress(1, this.dcRouter.address, {
        from: relayer,
      });

      await this.dcRouter.deposit(2, 10000000, { from: wallet1 });
      await this.dcRouter.initiateWithdraw(2, 10000000, { from: wallet1 });
      await this.pool.approveWithdraw(
        wallet1,
        ether("1"),
        2,
        1,
        this.dcRouter.address,
        500000,
        { from: relayer }
      );
    });
    it("cancel withdraw", async function () {
      await this.usdc.mint(wallet2, 100000000, { from: wallet2 });
      await this.usdc.approve(this.dcRouter.address, 100000000, {
        from: wallet2,
      });
      await this.pool.setTrustedRemoteAddress(1, this.dcRouter.address, {
        from: relayer,
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
      await this.pool.cancelWithdraw(1, 8, 1, this.dcRouter.address, 500000, {
        from: relayer,
      });
      totalPendingWithdrawal = await this.dcRouter.pendingStrategyWithdrawals(
        8
      );
      expect(totalPendingWithdrawal.toString()).to.equal("0");
    });
    it("Init initNewBB", async function () {
      console.log("relayer is", relayer);
      console.log("owner is", await this.bbfabric.owner());
      const initParams = this.defaultEncoder.encode(
        ["address", "address", "uint16"],
        [this.lzEndpoint.address, this.pool.address, 1]
      );
      await this.pool.setTrustedRemoteAddress(1, this.bbfabric.address, {
        from: relayer,
      });
      await this.pool.initNewBB(
        1,
        this.perpImpl.address,
        initParams,
        1,
        this.bbfabric.address,
        1500000,
        200000,
        { from: relayer }
      );

      const thirdProxy = await this.bbfabric.getProxyAddressToId(0);
      console.log("lzReceive call Proxy Address is:", thirdProxy);
      const lzDirectProxyId = await this.bbfabric.getStrategyIdToProxyAddress(
        thirdProxy
      );
      console.log("strategyId for first Proxy is:", lzDirectProxyId.toString());
      const lzDirectProxyImpl = await this.bbfabric.getImplToProxyAddress(
        thirdProxy
      );
      console.log(
        "Implementation for first Proxy is:",
        lzDirectProxyImpl.toString()
      );
    });
    it("upgrade upgradeBB", async function () {
      const initParams = this.defaultEncoder.encode(
        ["address", "address", "uint16"],
        [this.lzEndpoint.address, this.pool.address, 1]
      );
      await this.pool.setTrustedRemoteAddress(1, this.bbfabric.address, {
        from: relayer,
      });
      await this.registry.setTrustedRemoteAddress(1, this.bbfabric.address, {
        from: wallet1,
      });
      await this.pool.initNewBB(
        1,
        this.perpImpl.address,
        initParams,
        1,
        this.bbfabric.address,
        1500000,
        200000,
        { from: relayer }
      );
      console.log("Perp impl:", this.perpImpl.address.toString());
      console.log("Aave impl:", this.aaveImpl.address.toString());

      const upgradableProxy = await this.bbfabric.getProxyAddressToId(1);
      console.log("lzReceive call upgradableProxy is:", upgradableProxy);

      const lzDirectProxyId = await this.bbfabric.getStrategyIdToProxyAddress(
        upgradableProxy
      );
      console.log(
        "strategyId for upgradableProxy is:",
        lzDirectProxyId.toString()
      );
      let lzDirectProxyImpl = await this.bbfabric.getImplToProxyAddress(
        upgradableProxy
      );

      console.log(
        "Implementation for before Upgradable:",
        lzDirectProxyImpl.toString()
      );

      await this.pool.upgradeBB(
        1,
        upgradableProxy,
        this.aaveImpl.address,
        1,
        this.bbfabric.address,
        1500000,
        { from: relayer }
      );
      lzDirectProxyImpl = await this.bbfabric.getImplToProxyAddress(
        upgradableProxy
      );
      console.log(
        "Implementation for after Upgradable:",
        lzDirectProxyImpl.toString()
      );
    });
    it("pullOutLossERC20", async function () {
      let PoolBalance = await this.usdc.balanceOf(this.pool.address);
      expect(PoolBalance.toString()).to.equal("0");
      await this.usdc.mint(this.pool.address, 1000000000, { from: relayer });
      PoolBalance = await this.usdc.balanceOf(this.pool.address);
      expect(PoolBalance.toString()).to.equal("1000000000");
      let treasurerBalance = await this.usdc.balanceOf(relayer);
      expect(treasurerBalance.toString()).to.equal("0");
      await this.pool.pullOutLossERC20(await this.usdc.address, {
        from: relayer,
      });
      treasurerBalance = await this.usdc.balanceOf(relayer);
      PoolBalance = await this.usdc.balanceOf(this.pool.address);
      expect(treasurerBalance.toString()).to.equal("1000000000");
      expect(PoolBalance.toString()).to.equal("0");
    });
    it(" bridge tokens to BB from dcRouter", async function () {
      await this.usdc.mint(wallet1, 100000000, { from: wallet2 });
      await this.usdc.approve(this.dcRouter.address, 200000000, {
        from: wallet1,
      });
      await this.dcRouter.deposit(666, 100000000, { from: wallet1 });

      await this.pool.setBridge(
        this.sgBridgeMock.address,
        666,
        1,
        this.dcRouter.address,
        1500000,
        { from: relayer }
      );
      await this.pool.bridge(
        this.usdc.address,
        100000000,
        1,
        this.aaveImpl.address,
        this.usdt.address,
        1,
        this.dcRouter.address,
        750000,
        ether("25"),
        { value: ether("0.2"), from: relayer }
      );
      await this.pool.withdrawLostETH();
    });
  });
});
