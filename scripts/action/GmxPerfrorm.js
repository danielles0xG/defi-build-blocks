// npx hardhat run scripts/action/GmxPerform.js --network optimism
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const {
  ASSETS,
  ACTION_POOL,
  GMX_BB
} = require("./../../config/addresses.json");

const GMX_CONTRACT = require("../../artifacts/contracts/buildingBlocks/GmxVault.sol/GmxVault.json");

const ACTION_POOL_OPT = ACTION_POOL.MAINNET.ADDRESS;
const GMX_BB_AVALANCHE = GMX_BB.DC_BUILDING_BLOCK.avalanche;
const USDC_AVALANCHE = ASSETS.USDC.avalanche;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function setActionPool(
  ACTION_POOL_OPT,
  receiverId,
  receiverAddress,
  gasAmount
) {
  this.encoder = new ethers.utils.Interface(GMX_CONTRACT.abi);

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

async function buyGlp(buyingAsset, amount) {
  const actionData = this.defaultEncoder.encode(
    ["address", "uint256", "uint256", "uint256"],
    [buyingAsset, amount, 0, 0]
  );
  const lzActionData = this.encoder.encodeFunctionData("buyGLP(bytes)", [
    actionData,
  ]);
  await this.ActionPool.performAction(
    1,
    lzActionData,
    this.receiverId,
    this.receiverAddress,
    this.gasAmount,
    { value: this.lzMsgFee }
  );
}

async function sellGlp(tokenOut, amount, minOut) {
  const actionData = this.defaultEncoder.encode(
    ["address", "uint256", "uint256"],
    [tokenOut, amount, minOut]
  );
  const lzActionData = this.encoder.encodeFunctionData("sellGLP(bytes)", [
    actionData,
  ]);
  await this.ActionPool.performAction(
    1,
    lzActionData,
    this.receiverId,
    this.receiverAddress,
    this.gasAmount,
    { value: this.lzMsgFee }
  );
}

async function perform() {
  const BUYING_ASSET = USDC_AVALANCHE;
  const BUYING_AMOUNT = BigNumber.from("5000000");
  const ASSET_OUT = USDC_AVALANCHE;
  const SELL_AMOUNT = BigNumber.from("5000000000000000000");
  const GAS_AMOUNT = 1500000;
  const MIN_AMOUNT_OUT = 0;

  console.log("Starting interaction with GLP block");
  await setActionPool(ACTION_POOL_OPT, 106, GMX_BB_AVALANCHE, GAS_AMOUNT);
  await delay(2000);
  await setTrustedAddress(GMX_BB_AVALANCHE);
  await delay(2000);
  await buyGlp(BUYING_ASSET, BUYING_AMOUNT);
  await delay(2000);
  await sellGlp(ASSET_OUT, SELL_AMOUNT, MIN_AMOUNT_OUT);
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
