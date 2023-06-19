const { ether, expectRevert } = require("@openzeppelin/test-helpers");
const { artifacts, ethers } = require("hardhat");
const BB_CONTRACT = require("../artifacts/contracts/mocks/BBMock.sol/BBMock.json");
const { BigNumber } = require("ethers");
const { expect } = require("chai");

const POOL = artifacts.require("ActionPoolDcRouter");
const VAULT = artifacts.require("BBMock");
const FABRIC = artifacts.require("FabricMock");
const DECODER = artifacts.require("DecodeHelper");
const DCROUTER = artifacts.require("DcRouter");
const USDC = artifacts.require("USDCMock");
const LZENDPOINT = artifacts.require("LZEndpointMock");
const BRIDGE = artifacts.require("StargateMock");
const STRATEGY_REGISTRY = artifacts.require("StrategyRegistry");

// eslint-disable-next-line no-undef
contract("BaseBuildingBlock", function ([wallet1, relayer]) {
  before(async function () {
    this.defaultEncoder = ethers.utils.defaultAbiCoder;
    this.encoder = new ethers.utils.Interface(BB_CONTRACT.abi);
    this.lzEndpoint = await LZENDPOINT.new();
    this.pool = await POOL.new(relayer, this.lzEndpoint.address, 1, relayer, {
      from: wallet1,
    });
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
    this.usdc = await USDC.new({ from: wallet1 });
    this.usdt = await USDC.new({ from: wallet1 });
    this.dcRouter = await DCROUTER.new(
      relayer,
      1,
      this.lzEndpoint.address,
      this.usdc.address,
      this.pool.address,
      1,
      { from: relayer }
    );
    this.bbImpl = await VAULT.new(this.pool.address, { from: wallet1 });
    this.decoder = await DECODER.new({ from: wallet1 });
    this.bbb = await VAULT.new();
    const dataForInitialize = await this.decoder.dataForVault(
      this.lzEndpoint.address,
      this.pool.address,
      1
    );
    await this.bbb.initialize(dataForInitialize);
    this.sgBridgeMock = await BRIDGE.new({ from: relayer });
  });

  describe("ActionPool directly calls to native BB", function () {
    it("native perform to BB Mock", async function () {
      const initParams = this.defaultEncoder.encode(
        ["address", "address", "uint16"],
        [this.lzEndpoint.address, this.pool.address, 1]
      );
      await this.bbfabric.nativeInitNewProxy(
        5,
        this.bbImpl.address,
        initParams,
        { from: relayer }
      );
      const nativeProxy = await this.bbfabric.getProxyAddressToId(0);
      const AMOUNT = BigNumber.from("666");
      const actionData = this.defaultEncoder.encode(
        ["address", "uint256"],
        [this.pool.address, Number(String(AMOUNT))]
      );

      const lzActionData = this.encoder.encodeFunctionData("borrow(bytes)", [
        actionData,
      ]);
      await this.pool.performToNative(lzActionData, nativeProxy, 5, {
        from: relayer,
      });
    });
  });
  describe("ActionPool calls to destination BB with LZ Endpoint", function () {
    it("Approve to BB", async function () {
      const SUPPLY_AMOUNT = BigNumber.from("10000000");
      const lzActionData = this.encoder.encodeFunctionData(
        "approve(address,address,uint256)",
        [this.usdc.address, this.pool.address, Number(String(SUPPLY_AMOUNT))]
      );
      await this.pool.setTrustedRemoteAddress(
        1,
        await this.decoder.addressToBytes(this.bbb.address),
        { from: wallet1 }
      );
      const initPath = await this.pool.trustedRemoteLookup(1);
      expect(initPath.toString().toLowerCase()).to.equal(
        (this.bbb.address + this.pool.address.substring(2)).toLowerCase()
      );

      await this.pool.setTrustedRemoteAddress(1, wallet1, {
        from: wallet1,
      });
      const walletPath = await this.pool.trustedRemoteLookup(1);
      expect(walletPath.toString().toLowerCase()).to.equal(
        (wallet1 + this.pool.address.substring(2)).toLowerCase()
      );

      await this.pool.performAction(
        88,
        lzActionData,
        1,
        this.bbb.address,
        900000,
        { value: ether("0.2"), from: relayer }
      );
      const bbPath = await this.pool.trustedRemoteLookup(1);
      expect(bbPath.toString().toLowerCase()).to.equal(
        (this.bbb.address + this.pool.address.substring(2)).toLowerCase()
      );
    });
    it("set Bridge to BB", async function () {
      await this.pool.setBridge(wallet1, 2, 1, this.bbb.address, 950000, {
        value: ether("0.2"),
        from: relayer,
      });
    });
    it("set Stable to BB", async function () {
      await this.pool.setStable(wallet1, 2, 1, this.bbb.address, 950000, {
        value: ether("0.2"),
        from: relayer,
      });
    });
    it("set Native Router to BB", async function () {
      await this.pool.setTrustedRemoteAddress(
        1,
        await this.decoder.addressToBytes(this.bbb.address),
        { from: wallet1 }
      );
      const lzActionData = this.encoder.encodeFunctionData(
        "setNativeRouter(address)",
        [this.dcRouter.address]
      );
      await this.pool.performAction(
        88,
        lzActionData,
        1,
        this.bbb.address,
        900000,
        { value: ether("0.2"), from: relayer }
      );
    });
    it("back tokens to native Router", async function () {
      const AMOUNT = BigNumber.from("100000000");
      const lzActionData = this.encoder.encodeFunctionData(
        "backTokensToNative(address,uint256)",
        [this.usdc.address, Number(String(AMOUNT))]
      );
      await this.usdc.mint(this.bbb.address, 200000000);
      await this.pool.performAction(
        88,
        lzActionData,
        1,
        this.bbb.address,
        900000,
        { value: ether("0.2"), from: relayer }
      );
    });
    it("native bridge to dcRouter", async function () {
      await this.bbb.setBridge(this.sgBridgeMock.address);
      await this.usdc.mint(this.dcRouter.address, 300000000);
      await this.pool.bridgeToNative(
        this.bbb.address,
        this.usdc.address,
        100000000,
        1,
        this.dcRouter.address,
        this.usdc.address,
        { from: relayer }
      );
      await expectRevert(
        this.bbb.nativeBridge(
          this.usdc.address,
          100000000,
          1,
          this.dcRouter.address,
          this.usdt.address,
          { value: ether("0.2") }
        ),
        "SmartLZBase:Only self call"
      );
    });
  });
});
