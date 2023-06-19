// npx hardhat run scripts/action/AavePerform.js --network optimism
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { ether } = require("@openzeppelin/test-helpers");
const AAVE_CONTRACT = require("../../artifacts/contracts/buildingBlocks/AaveVault.sol/AaveVault.json");

const {
  ASSETS,
  ACTION_POOL,
  AAVE_BB
} = require("./../../config/addresses.json");

const ACTION_POOL_OPT_ADDRESS = ACTION_POOL.MAINNET.ADDRESS;
const AAVE_BB_AVALANCHE = AAVE_BB.DC_BUILDING_BLOCK.avalanche;
const USDC_AVALANCHE = ASSETS.USDC.avalanche;
const FRAX_AVALANCHE = ASSETS.FRAX.avalanche;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function setActionPool(
  ACTION_POOL_OPT,
  receiverId,
  receiverAddress,
  gasAmount
) {
  this.encoder = new ethers.utils.Interface(AAVE_CONTRACT.abi);

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
async function setTrustedAddress(address){
  await this.ActionPool.setTrustedRemoteAddress(
    this.receiverId,
    address
  );
}

async function openPosition(asset, amount) {
  const actionData = this.defaultEncoder.encode(
    ["address", "uint256", "uint16"],
    [asset, Number(String(amount)), 0]
  );
  const lzActionData = this.encoder.encodeFunctionData("openPosition(bytes)", [
    actionData,
  ]);

  await this.ActionPool.performAction(
    2,
    lzActionData,
    this.receiverId,
    this.receiverAddress,
    this.gasAmount,
    { value: this.lzMsgFee }
  );
}

async function setCollateralAsset(collateralAsset) {
  const lzActionData = this.encoder.encodeFunctionData(
    "setCollateralAsset(bytes)",
    [collateralAsset]
  );
  await this.ActionPool.performAction(
    1,
    lzActionData,
    this.receiverId,
    this.receiverAddress,
    this.gasAmount,
    { value: this.lzMsgFee }
  );
}

async function borrow(borrowAsset, borrowAmount, borrowRate) {
  const actionData = this.defaultEncoder.encode(
    ["address", "uint256", "uint16", "uint16"],
    [borrowAsset, borrowAmount, borrowRate, 0]
  );
  const lzActionData = this.encoder.encodeFunctionData("borrow(bytes)", [
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

async function repay(repayAsset, repayAmount, borrowedRate) {
  const actionData = this.defaultEncoder.encode(
    ["address", "uint256", "uint16"],
    [repayAsset, repayAmount, borrowedRate]
  );
  const lzActionData = this.encoder.encodeFunctionData("repay(bytes)", [
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

async function closePosition(asset, amount) {
  const actionData = this.defaultEncoder.encode(
    ["address", "uint256"],
    [asset, amount]
  );
  const lzActionData = this.encoder.encodeFunctionData("closePosition(bytes)", [
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
  this.txOptions = {
    gasLimit: 2100,
    gasPrice: ethers.utils.parseUnits("1", "gwei").toString(),
    value: BigNumber.from("8000000000000000"),
  };
  const SUPPLY_ASSET = USDC_AVALANCHE;
  const SUPPLY_AMOUNT = BigNumber.from("9700000");
  const BORROW_ASSET = FRAX_AVALANCHE;
  const BORROW_AMOUNT = BigNumber.from(String(ether("10")));
  const BORROW_RATE = 2;
  const GAS_AMOUNT = 1500000;

  await setActionPool(
    ACTION_POOL_OPT_ADDRESS,
    106,
    AAVE_BB_AVALANCHE,
    GAS_AMOUNT
  );
  await delay(2000);
  await setTrustedAddress(AAVE_BB_AVALANCHE);
  console.log("Starting interaction with AAVE block");
  await openPosition(SUPPLY_ASSET, SUPPLY_AMOUNT);
  await delay(2000);
  await setCollateralAsset(USDC_AVALANCHE);
  await delay(2000);
  await borrow(BORROW_ASSET, BORROW_AMOUNT, BORROW_RATE);
  await delay(2000);
  await repay(BORROW_ASSET, BORROW_AMOUNT, BORROW_RATE);
  await delay(2000);
  await closePosition(SUPPLY_ASSET, SUPPLY_AMOUNT);
}

perform()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
    throw Error;
  });
