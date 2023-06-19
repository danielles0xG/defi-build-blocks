// npx hardhat run scripts/action/ApproveWithdraw.js --network optimism
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const {ether} = require("@openzeppelin/test-helpers");

const {
  LZ_ENDPOINTS,
  ACTION_POOL,
  ROUTERS
} = require("./../../config/addresses.json");

const ROUTER_CONTRACT = require("./../../artifacts/contracts/BBFabric.sol/BBFabric.json");
const ROUTER_BSC = ROUTERS.bsc_mainnet;
const ACTION_POOL_OPT = ACTION_POOL.MAINNET.ADDRESS;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function setActionPool(
  ACTION_POOL_OPT,
  receiverId,
  receiverAddress,
  gasAmount
) {
  this.encoder = new ethers.utils.Interface(ROUTER_CONTRACT.abi);

  this.defaultEncoder = ethers.utils.defaultAbiCoder;
  this.ActionPool = await hre.ethers.getContractAt(
    "ActionPoolDcRouter",
    ACTION_POOL_OPT
  );
  this.receiverId = receiverId;
  this.receiverAddress = receiverAddress;
  this.gasAmount = gasAmount;
  this.lzMsgFee = BigNumber.from("6000000000000000");
}

async function approve(
  id,
  stableDeTokenPrice,
  strategyId,
  recipientId,
  recipient,
  gasForDstLzReceive
) {
  await this.ActionPool.approveWithdraw(
    id,
    stableDeTokenPrice,
    strategyId,
    recipientId,
    recipient,
    gasForDstLzReceive,
    { value: this.lzMsgFee }
  );
}


async function perform() {
  const GAS_AMOUNT = 700000;
  const ROUTER_ID = LZ_ENDPOINTS.bsc_mainnet.ID;
  const STRATEGY_ID = BigNumber.from("666");
  const STABLE_PRICE = ether("1").toString();
  const WITHDRAW_ID = 1;

  console.log("Starting interaction with Router");

  await setActionPool(ACTION_POOL_OPT, ROUTER_ID, ROUTER_BSC, GAS_AMOUNT);
  await delay(2000);
  await approve(WITHDRAW_ID,STABLE_PRICE,STRATEGY_ID,ROUTER_ID,ROUTER_BSC,GAS_AMOUNT);
  await delay(2000);
}

perform()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
    throw Error;
  });