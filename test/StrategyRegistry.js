const { artifacts, ethers } = require("hardhat");
const { expect } = require("chai");
const { expectEvent } = require("@openzeppelin/test-helpers");

const POOL = artifacts.require("ActionPoolDcRouter");
const VAULT = artifacts.require("BBMock");
const FABRIC = artifacts.require("FabricMock");
const STRATEGY_REGISTRY = artifacts.require("StrategyRegistry");
const LZENDPOINT = artifacts.require("LZEndpointMock");

const STRATEGY_1 = 1;
const STRATEGY_2 = 2;

const CHAIN_A = 1;
const CHAIN_B = 2;
const CHAIN_C = 3;

// eslint-disable-next-line no-undef
contract(
  "StrategyRegistry",
  function ([wallet1, relayer, lzEndpoint, fakeAddress]) {
    before(async function () {
      this.defaultEncoder = ethers.utils.defaultAbiCoder;
      this.lzEndpoint = await LZENDPOINT.new();
      this.pool = await POOL.new(
        relayer,
        this.lzEndpoint.address,
        CHAIN_A,
        relayer,
        {
          from: wallet1,
        }
      );
      await this.pool.setRelayer(relayer, { from: relayer });
      this.perpImpl = await VAULT.new(this.pool.address, { from: wallet1 });
      this.aaveImpl = await VAULT.new(this.pool.address, { from: wallet1 });
      this.registry = await STRATEGY_REGISTRY.new(
        2, // 2 chains
        0x20003, // 2 chains with ids 2 and 3
        CHAIN_A,
        this.lzEndpoint.address,
        relayer,
        CHAIN_A, // Action pool chain
        { from: wallet1 }
      );
      this.encoder = new ethers.utils.Interface(this.registry.abi);
      this.bbfabric = await FABRIC.new(
        CHAIN_B, // fabric chain
        this.lzEndpoint.address,
        this.pool.address,
        CHAIN_A, // action pool chain
        CHAIN_A, // registry chainId
        this.registry.address,
        {
          from: relayer,
        }
      );
      this.bbfabric_C = await FABRIC.new(
        CHAIN_C, // fabric chain
        this.lzEndpoint.address,
        this.pool.address,
        CHAIN_A, // action pool chain
        CHAIN_A, // registry chainId
        this.registry.address,
        {
          from: relayer,
        }
      );
      await this.pool.setTrustedRemoteAddress(CHAIN_B, this.bbfabric.address, {
        from: wallet1,
      });
      await this.registry.setTrustedRemoteAddress(
        CHAIN_A,
        this.bbfabric.address,
        {
          from: wallet1,
        }
      );
      await this.registry.setTrustedRemoteAddress(
        CHAIN_B,
        this.bbfabric.address,
        {
          from: wallet1,
        }
      );
      await this.registry.setTrustedRemoteAddress(
        CHAIN_C,
        this.bbfabric_C.address,
        {
          from: wallet1,
        }
      );
    });

    beforeEach(async function () {});

    describe("Registry create blocks", function () {
      it("BB Add", async function () {
        const localRegistry = await STRATEGY_REGISTRY.new(
          2, // 2 chains
          0x20003, // 2 chains with ids 2 and 3
          CHAIN_A,
          this.lzEndpoint.address,
          lzEndpoint,
          CHAIN_A, // Action pool chain
          { from: wallet1 }
        );

        const receipt = await localRegistry.addBB(
          STRATEGY_1,
          CHAIN_B,
          this.perpImpl.address,
          fakeAddress,
          { from: lzEndpoint }
        );
        await expectEvent(receipt, "BBAdded", {
          strategyId: STRATEGY_1.toString(),
          chainId: CHAIN_B.toString(),
          bbImpl: this.perpImpl.address,
          bb: fakeAddress,
        });
      });

      it("Block should be added to registry", async function () {
        const initParams = this.defaultEncoder.encode(
          ["address", "address", "uint16"],
          [this.lzEndpoint.address, this.pool.address, CHAIN_B]
        );
        await this.pool.initNewBB(
          STRATEGY_1,
          this.perpImpl.address,
          initParams,
          CHAIN_B,
          this.bbfabric.address,
          1500000,
          200000,
          { from: relayer }
        );

        const proxy = await this.bbfabric.getProxyAddressToId(0);

        const bbAddress = await this.registry.blockForStrategy(
          STRATEGY_1,
          CHAIN_B,
          this.perpImpl.address
        );
        expect(bbAddress.toString()).to.equal(proxy.toString());
      });

      it("Create block in another chain", async function () {
        const initParams = this.defaultEncoder.encode(
          ["address", "address", "uint16"],
          [this.lzEndpoint.address, this.pool.address, CHAIN_C]
        );
        await this.registry.setTrustedRemoteAddress(
          CHAIN_A,
          this.bbfabric_C.address,
          {
            from: wallet1,
          }
        );
        await this.pool.initNewBB(
          STRATEGY_1,
          this.perpImpl.address,
          initParams,
          CHAIN_C,
          this.bbfabric_C.address,
          1500000,
          200000,
          { from: relayer }
        );

        await this.pool.initNewBB(
          STRATEGY_2,
          this.perpImpl.address,
          initParams,
          CHAIN_C,
          this.bbfabric_C.address,
          1500000,
          200000,
          { from: relayer }
        );

        const proxy = await this.bbfabric_C.getProxyAddressToId(0);

        const bbAddress = await this.registry.blockForStrategy(
          STRATEGY_1,
          CHAIN_C,
          this.perpImpl.address
        );
        expect(bbAddress.toString()).to.equal(proxy.toString());
      });

      it("Get BBs", async function () {
        const bbs = await this.registry.getBBs(
          STRATEGY_1,
          this.perpImpl.address
        );
        const proxy1 = await this.bbfabric.getProxyAddressToId(0);
        const proxy2 = await this.bbfabric_C.getProxyAddressToId(0);
        const elements = [
          proxy2.toString(),
          CHAIN_C.toString(),
          proxy1.toString(),
          CHAIN_B.toString(),
        ];
        expect(bbs.toString()).to.equal(elements.join(","));
      });

      it("check existence", async function () {
        const exist = await this.registry.check(
          STRATEGY_1,
          CHAIN_B,
          this.perpImpl.address
        );
        expect(exist).to.equal(true);
      });
      it("check non existence", async function () {
        const notExist = await this.registry.check(
          STRATEGY_2,
          CHAIN_B,
          this.perpImpl.address
        );
        expect(notExist).to.equal(false);
      });
    });
  }
);
