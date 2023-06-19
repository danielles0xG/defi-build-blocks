// npx hardhat run scripts/action/BridgeToBB.js --network optimism
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const {
  ASSETS,
  LZ_ENDPOINTS,
  ACTION_POOL,
  AAVE_BB,
  GMX_BB,
  BRIDGES,
  ROUTERS
} = require("./../../config/addresses.json");

const ROUTER_CONTRACT = require("./../../artifacts/contracts/DcRouter.sol/DcRouter.json");
const {ether} = require("@openzeppelin/test-helpers");

const ROUTER_BSC = ROUTERS.bsc_mainnet;
const ACTION_POOL_OPT = ACTION_POOL.MAINNET.ADDRESS;
const AAVE_ADDRESS = AAVE_BB.DC_BUILDING_BLOCK.avalanche;
const GMX_ADDRESS = GMX_BB.DC_BUILDING_BLOCK.avalanche;

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
  this.lzMsgFee = BigNumber.from("10000000000000000");
}

async function setTrustedAddress(id, address){
  await this.ActionPool.setTrustedRemoteAddress(
    id,
    address
  );
}

async function setBridge(bridge, strategyId, receiverId, recipient, gas){
  await this.ActionPool.setBridge(
    bridge,
    strategyId,
    receiverId,
    recipient,
    gas,
    { value: this.lzMsgFee }
  );
}

async function bridgeToBB(
  receiverStableToken,
  stableAmount,
  finalRecipientId,
  finalRecipient,
  finalStableToken,
  receiverId,
  receiverAddress,
  gasAmount,
  nativeForDst
){

  await this.ActionPool.bridge(
    receiverStableToken,
    stableAmount,
    finalRecipientId,
    finalRecipient,
    finalStableToken,
    receiverId,
    receiverAddress,
    gasAmount,
    nativeForDst,
    { value: this.lzMsgFee }
  );
}

async function perform() {
  this.txOptions = {
    gasLimit: 2100,
    gasPrice: ethers.utils.parseUnits("1", "gwei").toString(),
    value: BigNumber.from("8000000000000000"),
  };
  const BSC_ID = LZ_ENDPOINTS.bsc_mainnet.ID;
  const USDC_BSC = ASSETS.USDC.bsc_mainnet;
  const USDC_AVAX = ASSETS.USDC.avalanche;
  const GAS_AMOUNT = 700000;
  const STRATEGY_ID = 666;
  const AVAX_BRIDGE = BRIDGES.avalanche.Bridge;
  const STABLE_AMOUNT = ether("5").toString();
  const BB_ID = LZ_ENDPOINTS.avalanche.ID;
  const NATIVE_DESTINATION_GAS = BigNumber.from("6000000000000000");

  console.log("Starting interaction with Router");
  await setActionPool(ACTION_POOL_OPT, BSC_ID, ROUTER_BSC, GAS_AMOUNT);
  await delay(2000);

  await setTrustedAddress(BB_ID,AAVE_ADDRESS);
  await delay(2000);
  await setBridge(AVAX_BRIDGE,STRATEGY_ID,BB_ID,AAVE_ADDRESS,GAS_AMOUNT);
  await delay(10000);

  await setTrustedAddress(BB_ID,GMX_ADDRESS);
  await delay(2000);
  await setBridge(AVAX_BRIDGE,STRATEGY_ID,BB_ID,GMX_ADDRESS,GAS_AMOUNT);
  await delay(2000);

  await bridgeToBB(USDC_BSC,STABLE_AMOUNT,BB_ID,AAVE_ADDRESS,USDC_AVAX,BSC_ID,ROUTER_BSC,GAS_AMOUNT,NATIVE_DESTINATION_GAS);
  await delay(2000);

  await bridgeToBB(USDC_BSC,STABLE_AMOUNT,BB_ID,GMX_ADDRESS,USDC_AVAX,BSC_ID,ROUTER_BSC,GAS_AMOUNT,NATIVE_DESTINATION_GAS);
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