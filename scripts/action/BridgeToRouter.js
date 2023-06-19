// npx hardhat run scripts/action/BridgeToRouter.js --network optimism
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

const ROUTER_CONTRACT = require("./../../artifacts/contracts/BBFabric.sol/BBFabric.json");

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

async function setTrustedAddress(address) {

  await this.ActionPool.setTrustedRemoteAddress(
    this.receiverId,
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

async function setUSDC(usdcBsc, strategyId,receiverId, recipient, gas){
  await this.ActionPool.setStable(
    usdcBsc,
    strategyId,
    receiverId,
    recipient,
    gas,
    { value: this.lzMsgFee }
  );
}

async function bridgeToRouter(
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
  const USDC_BSC = ASSETS.USDC.bsc_mainnet;
  const USDC_AVAX = ASSETS.USDC.avalanche;
  const GAS_AMOUNT = 700000;
  const BRIDGE = BRIDGES.avalanche.Bridge;
  const STRATEGY_ID = 666;
  const STABLE_AMOUNT = BigNumber.from("9900000");
  const BB_ID = LZ_ENDPOINTS.avalanche.ID;
  const ROUTER_ID = LZ_ENDPOINTS.bsc_mainnet.ID;
  const NATIVE_DESTINATION_GAS = BigNumber.from("100000000000000000");

  console.log("Starting interaction with Router");
  await setActionPool(ACTION_POOL_OPT, BB_ID, AAVE_ADDRESS, GAS_AMOUNT);
  await delay(2000);

  await setTrustedAddress(AAVE_ADDRESS);
  await delay(180000);

  await setBridge(BRIDGE,STRATEGY_ID,BB_ID,AAVE_ADDRESS,GAS_AMOUNT);
  await delay(180000);

  await setUSDC(USDC_AVAX,STRATEGY_ID,BB_ID,AAVE_ADDRESS,GAS_AMOUNT);
  await delay(180000);

  await bridgeToRouter(USDC_AVAX,STABLE_AMOUNT,ROUTER_ID,ROUTER_BSC,USDC_BSC,BB_ID,AAVE_ADDRESS,GAS_AMOUNT,NATIVE_DESTINATION_GAS);
  await delay(2000);


  await setActionPool(ACTION_POOL_OPT, BB_ID, GMX_ADDRESS, GAS_AMOUNT);
  await delay(2000);

  await setTrustedAddress(GMX_ADDRESS);
  await delay(180000);

  await setBridge(BRIDGE,STRATEGY_ID,BB_ID,GMX_ADDRESS,GAS_AMOUNT);
  await delay(180000);

  await setUSDC(USDC_AVAX,STRATEGY_ID,BB_ID,GMX_ADDRESS,GAS_AMOUNT);
  await delay(180000);

  await bridgeToRouter(USDC_AVAX,STABLE_AMOUNT,ROUTER_ID,ROUTER_BSC,USDC_BSC,BB_ID,GMX_ADDRESS,GAS_AMOUNT,NATIVE_DESTINATION_GAS);
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