const { artifacts, ethers } = require("hardhat");
const { expect } = require("chai");

const POOL = artifacts.require("ActionPoolDcRouter");
const VAULT = artifacts.require("BBMock");
const FABRIC = artifacts.require("FabricMock");
const STRATEGY_REGISTRY = artifacts.require("StrategyRegistry");
const LZENDPOINT = artifacts.require("LZEndpointMock");

// eslint-disable-next-line no-undef
contract("BBFabric", function ([wallet1, relayer, lzEndpoint]) {
  before(async function () {
    this.defaultEncoder = ethers.utils.defaultAbiCoder;
    this.lzEndpoint = await LZENDPOINT.new();
    this.pool = await POOL.new(relayer, lzEndpoint, 1, relayer, {
      from: wallet1,
    });
    // await this.pool.initialize(1, relayer,lzEndpoint, relayer);
    await this.pool.setRelayer(relayer, { from: relayer });
    this.registry = await STRATEGY_REGISTRY.new(
      1,
      0x1,
      1,
      this.lzEndpoint.address,
      relayer,
      1,
      { from: wallet1 }
    );
    this.bbfabric = await FABRIC.new(
      1,
      this.lzEndpoint.address,
      relayer,
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
    this.perpImpl = await VAULT.new(this.pool.address, { from: wallet1 });
    this.aaveImpl = await VAULT.new(this.pool.address, { from: wallet1 });
    await this.bbfabric.setTrustedRemoteAddress(1, this.bbfabric.address, {
      from: relayer,
    });
  });

  describe("ActionPool directly calls", function () {
    it("initial params ", async function () {
      const nativeChain = await this.bbfabric.getNativeChainId();
      expect(nativeChain.toString()).to.equal("1");

      const treasurer = await this.pool.getDeCommasTreasurer();
      expect(treasurer.toString()).to.equal(relayer);
    });

    it("Init initNewBBACMock", async function () {
      console.log("relayer is", relayer);
      console.log("owner is", await this.bbfabric.owner());
      const initParams = this.defaultEncoder.encode(
        ["address", "address", "uint16"],
        [this.lzEndpoint.address, this.pool.address, 1]
      );
      await this.bbfabric.initNewBBACMock(
        1,
        this.perpImpl.address,
        initParams,
        1,
        this.bbfabric.address
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

    it("upgrade upgradeBBACMock", async function () {
      const initParams = this.defaultEncoder.encode(
        ["address", "address", "uint16"],
        [this.lzEndpoint.address, this.pool.address, 1]
      );
      await this.bbfabric.initNewBBACMock(
        1,
        this.perpImpl.address,
        initParams,
        1,
        this.bbfabric.address
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

      await this.bbfabric.upgradeBBACMock(
        1,
        upgradableProxy,
        this.aaveImpl.address,
        1,
        this.bbfabric.address
      );
      lzDirectProxyImpl = await this.bbfabric.getImplToProxyAddress(
        upgradableProxy
      );
      console.log(
        "Implementation for after Upgradable:",
        lzDirectProxyImpl.toString()
      );
    });

    it("All data proxy", async function () {
      console.log(
        "all Bb Data: ",
        await this.bbfabric.getAllBbData({ from: wallet1 })
      );
    });
  });
  describe("ActionPool native calls", function () {
    it("Init native initNewBBACMock", async function () {
      const initParams = this.defaultEncoder.encode(
        ["address", "address", "uint16"],
        [this.lzEndpoint.address, this.pool.address, 1]
      );
      await this.bbfabric.nativeInitNewProxy(
        5,
        this.perpImpl.address,
        initParams,
        { from: relayer }
      );

      const nativeProxy = await this.bbfabric.getProxyAddressToId(2);
      console.log("Action Pool call Proxy Address is:", nativeProxy);
      const lzDirectProxyId = await this.bbfabric.getStrategyIdToProxyAddress(
        nativeProxy
      );
      console.log("strategyId for first Proxy is:", lzDirectProxyId.toString());
      const lzDirectProxyImpl = await this.bbfabric.getImplToProxyAddress(
        nativeProxy
      );
      console.log(
        "Implementation for first Proxy is:",
        lzDirectProxyImpl.toString()
      );
    });

    it("upgrade native upgradeBBACMock", async function () {
      const initParams = this.defaultEncoder.encode(
        ["address", "address", "uint16"],
        [this.lzEndpoint.address, this.pool.address, 1]
      );
      await this.bbfabric.nativeInitNewProxy(
        6,
        this.aaveImpl.address,
        initParams,
        { from: relayer }
      );

      const upgradableNativeProxy = await this.bbfabric.getProxyAddressToId(3);
      console.log("lzReceive call upgradableProxy is:", upgradableNativeProxy);

      const lzDirectProxyId = await this.bbfabric.getStrategyIdToProxyAddress(
        upgradableNativeProxy
      );
      console.log(
        "strategyId for upgradableProxy is:",
        lzDirectProxyId.toString()
      );
      let lzDirectProxyImpl = await this.bbfabric.getImplToProxyAddress(
        upgradableNativeProxy
      );

      console.log(
        "Implementation for before Upgradable:",
        lzDirectProxyImpl.toString()
      );

      await this.bbfabric.nativeUpgradeProxyImplementation(
        6,
        upgradableNativeProxy,
        this.perpImpl.address,
        { from: relayer }
      );
      lzDirectProxyImpl = await this.bbfabric.getImplToProxyAddress(
        upgradableNativeProxy
      );
      console.log(
        "Implementation for after Upgradable:",
        lzDirectProxyImpl.toString()
      );
    });
  });
});
