// npx hardhat run scripts/action/WithdrawProcess.js --network bsc_mainnet
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { ether } = require("@openzeppelin/test-helpers");

const {
  ROUTERS
} = require("./../../config/addresses.json");

const ROUTER_CONTRACT = require("./../../artifacts/contracts/DcRouter.sol/DcRouter.json");
const ROUTER_BSC = ROUTERS.bsc_mainnet;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function setDcRouter() {
  this.encoder = new ethers.utils.Interface(ROUTER_CONTRACT.abi);
  this.defaultEncoder = ethers.utils.defaultAbiCoder;
  this.dcRouter = await hre.ethers.getContractAt(
    "DcRouter",
    ROUTER_BSC
  );
}

async function initWithdraw(strategyId, amount){
  await this.dcRouter.initiateWithdraw(
    strategyId,
    amount
  );
}

async function perform() {
  const STABLE_AMOUNT = ether("10").toString();
  const STRATEGY_ID = BigNumber.from("666");

  console.log("Starting withdraw Process");
  await setDcRouter();

  await delay(2000);
  await initWithdraw(STRATEGY_ID, STABLE_AMOUNT);
}

perform()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
    throw Error;
  });