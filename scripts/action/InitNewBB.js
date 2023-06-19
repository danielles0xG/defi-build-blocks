// npx hardhat run scripts/action/initNewBB.js --network optimism
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const {
  ASSETS,
  LZ_ENDPOINTS,
  ACTION_POOL,
  AAVE_BB,
  GMX_BB,
  BB_FABRICS
} = require("./../../config/addresses.json");

const FABRIC_CONTRACT = require("./../../artifacts/contracts/BBFabric.sol/BBFabric.json");

const FABRIC_AVALANCHE = BB_FABRICS.avalanche;
const ACTION_POOL_OPT = ACTION_POOL.MAINNET.ADDRESS;
const ACTION_POOL_ID = ACTION_POOL.MAINNET.ID;
const AAVE_IMPLEMENT = AAVE_BB.IMPLEMENTATION.avalanche;
const GMX_IMPLEMENT = GMX_BB.IMPLEMENTATION.avalanche;

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
async function initAaveProxy(lzAddress, lzId, usdc){

  const constructorDataFoAave = this.defaultEncoder.encode(
    [
      "address",
      "address",
      "address",
      "address",
      "uint16",
      "address",
      "uint16",
      "address"
    ],
    [
      AAVE_BB.AAVE.avalanche.POOL_ADDRESS_PROVIDER,
      AAVE_BB.AAVE.avalanche.WETH_GATEWAY,
      AAVE_BB.AAVE.avalanche.REWARD_CONTROLLER,
      ACTION_POOL_OPT,
      ACTION_POOL_ID,
      lzAddress,
      lzId,
      usdc
    ]  );

  await this.ActionPool.initNewBB(
    666,
    AAVE_IMPLEMENT,
    constructorDataFoAave,
    this.receiverId,
    this.receiverAddress,
    this.gasAmount,
    { value: this.lzMsgFee }
  );
}
async function initGMXProxy(lzAddress, lzId, usdc){
  const constructorDataForGMX = this.defaultEncoder.encode(
    [
      "address",
      "address",
      "address",
      "uint16",
      "address",
      "uint16",
      "address"
    ],
    [
      GMX_BB.GMX.VAULT.avalanche,
      GMX_BB.GMX.REWARD_ROUTER.avalanche,
      ACTION_POOL_OPT,
      ACTION_POOL_ID,
      lzAddress,
      lzId,
      usdc
    ]
  );

  await this.ActionPool.initNewBB(
    666,
    GMX_IMPLEMENT,
    constructorDataForGMX,
    this.receiverId,
    this.receiverAddress,
    this.gasAmount,
    { value: this.lzMsgFee }
  );
}

async function perform() {
  const LZ_ADDRESS = LZ_ENDPOINTS.avalanche.ADDRESS;
  const LZ_ID = LZ_ENDPOINTS.avalanche.ID;
  const USDC = ASSETS.USDC.avalanche;
  const GAS_AMOUNT = 1600000;
  console.log("Starting interaction with fabric");
  await setActionPool(ACTION_POOL_OPT, LZ_ID, FABRIC_AVALANCHE, GAS_AMOUNT);
  await setTrustedAddress(FABRIC_AVALANCHE);
  await delay(2000);

  await initAaveProxy(LZ_ADDRESS,LZ_ID,USDC);
  await delay(2000);

  await initGMXProxy(LZ_ADDRESS,LZ_ID,USDC);
  await delay(200000);
}

perform()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
    throw Error;
  });