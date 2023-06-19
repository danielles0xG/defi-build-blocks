// npx hardhat run scripts/action/TransferDeposits.js --network optimismgoerli
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { ether } = require("@openzeppelin/test-helpers");

const {
  ROUTERS,
  BRIDGES,
  AAVE_BB
} = require("./../../config/addresses.json");

const ROUTER_CONTRACT = require("./../../artifacts/contracts/DcRouter.sol/DcRouter.json");
const {ACTION_POOL} = require("../../config/addresses.json");

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function setDcRouter(router) {
  this.encoder = new ethers.utils.Interface(ROUTER_CONTRACT.abi);
  this.defaultEncoder = ethers.utils.defaultAbiCoder;
  this.dcRouter = await hre.ethers.getContractAt(
    "DcRouter",
    router
  );
}

async function transferDeposits(actionPool, routerChainId,
                                strategyId, tvl, bbChainId, bbAddress, amount, token){
  const actionData = this.defaultEncoder.encode(
      ["uint16[]", "address[]", "uint256[]", "address[]", "uint256", "uint256"],
      [[bbChainId], [bbAddress], [amount], [token], strategyId, tvl]
  );
  this.actionPool = await hre.ethers.getContractAt(
      "ActionPoolDcRouter",
      actionPool
  );
  let lzMsgFee = BigNumber.from("200000000000000000");
  let lzMsgFeeRouter = BigNumber.from("100000000000000000");
  await this.actionPool.processDeposits(
      actionData,
      routerChainId,
      this.dcRouter.address,
      700000,
      lzMsgFeeRouter,
      {value: lzMsgFee}
  );
}

async function perform() {
  const network = hre.network.name;
  const routerSelect = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ROUTERS.bsctestnet : ROUTERS.bsc_mainnet;
  const routerChainId = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? BRIDGES.bsctestnet.chainId : BRIDGES.bsc_mainnet.chainId;
  const actionPoolSelect = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET.ADDRESS : ACTION_POOL.MAINNET.ADDRESS

  const bridgeSelect =  ACTION_POOL.TESTNET.NETWORKS.includes(network) ? BRIDGES.fujiavax : BRIDGES.avalanche
  const STRATEGY_ID = BigNumber.from("666");

  console.log("Starting deposit transfer");
  await setDcRouter(routerSelect);

  await delay(2000);
  const STRATEGY_TVL = ether("200").toString();
  const BB_CHAIN_ID = bridgeSelect.chainId;
  const BB_ADDRESS = AAVE_BB.DC_BUILDING_BLOCK.avalanche;
  const AMOUNT = ether("10").toString();
  const BB_TOKEN = bridgeSelect.USDC;
  await transferDeposits(actionPoolSelect, routerChainId,
    STRATEGY_ID, STRATEGY_TVL, BB_CHAIN_ID, BB_ADDRESS, AMOUNT, BB_TOKEN
  );
}

perform()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
    throw Error;
  });
