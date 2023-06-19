// npx hardhat run scripts/action/initNewBB.js --network optimism
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const {
  ASSETS,
  LZ_ENDPOINTS,
  ACTION_POOL,
  ROUTERS,
  BRIDGES
} = require("./../../config/addresses.json");

const FABRIC_CONTRACT = require("./../../artifacts/contracts/BBFabric.sol/BBFabric.json");

const ACTION_POOL_OPT = ACTION_POOL.MAINNET.ADDRESS;
const BSC_ROUTER = ROUTERS.bsc_mainnet;
const BSC_BRIDGE = BRIDGES.bsc_mainnet.Bridge;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function setActionPool(
  ACTION_POOL_OPT,
  receiverId,
  receiverAddress,
  gasAmount
) {
  this.encoder = new ethers.utils.Interface(FABRIC_CONTRACT.abi);

  this.defaultEncoder = ethers.utils.defaultAbiCoder;
  this.ActionPool = await hre.ethers.getContractAt(
    "ActionPoolDcRouter",
    ACTION_POOL_OPT
  );
  this.receiverId = receiverId;
  this.receiverAddress = receiverAddress;
  this.gasAmount = gasAmount;
  this.lzMsgFee = BigNumber.from("8000000000000000");
}
async function setTrustedAddress(address){
  await this.ActionPool.setTrustedRemoteAddress(
    this.receiverId,
    address
  );
}
async function setBridge(bridge, id, recipientId, recipient, gas){
  await this.ActionPool.setBridge(
    bridge,
    id,
    recipientId,
    recipient,
    gas,
    { value: this.lzMsgFee }
  );
}
async function setStable(
  token,
  id,
  recipientId,
  recipient,
  gas){

  await this.ActionPool.setStable(
    token,
    id,
    recipientId,
    recipient,
    gas,
    { value: this.lzMsgFee }
  );
}

async function perform() {
  const BCS_ID = LZ_ENDPOINTS.bsc_mainnet.ID;
  const USDC_BSC = ASSETS.USDC.bsc_mainnet;
  const GAS_AMOUNT = 800000;
  const STRATEGY_ID = 666;

  console.log("Starting interaction with fabric");
  await setActionPool(ACTION_POOL_OPT, BCS_ID, BSC_ROUTER, GAS_AMOUNT);
  await delay(20000);
  await setTrustedAddress(BSC_ROUTER);
  await delay(20000);
  await setBridge(BSC_BRIDGE, STRATEGY_ID, BCS_ID, BSC_ROUTER, GAS_AMOUNT);
  await delay(20000);
  await setStable(USDC_BSC,STRATEGY_ID,BCS_ID,BSC_ROUTER,GAS_AMOUNT);
  await delay(20000);
}

perform()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
    throw Error;
  });