// npx hardhat run scripts/action/DepositProcess.js --network bsc_mainnet | bsctestnet
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { ether } = require("@openzeppelin/test-helpers");

const {
  ASSETS,
  ROUTERS
} = require("./../../config/addresses.json");

const USDC_CONTRACT = require("./../../artifacts/contracts/mocks/USDCMock.sol/USDCMock.json");

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

async function setUSDC(usdc) {
  this.encoder = new ethers.utils.Interface(USDC_CONTRACT.abi);
  this.defaultEncoder = ethers.utils.defaultAbiCoder;
  this.usdc = await hre.ethers.getContractAt(
    "USDCMock",
    usdc
  );
}

async function approve(spender,amount){
  await this.usdc.approve(
    spender,
    amount
  );
}

async function depositProcess(strategyId, amount){
  await this.dcRouter.deposit(
    strategyId,
    amount
  );
}

async function perform() {
  const network = hre.network.name;
  const routerSelect = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ROUTERS.bsctestnet : ROUTERS.bsc_mainnet;
  const usdcSelect = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ASSETS.USDC.bsctestnet : ASSETS.USDC.bsc_mainnet;

  const STABLE_AMOUNT = ether("10").toString();
  const APPROVE_AMOUNT = ether("100").toString();
  const STRATEGY_ID = BigNumber.from("666");

  console.log("Starting deposit Process");
  await setDcRouter(routerSelect);
  await setUSDC(usdcSelect);

  await delay(2000);
  await approve(routerSelect, APPROVE_AMOUNT);

  await delay(2000);
  await depositProcess(STRATEGY_ID, STABLE_AMOUNT);

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
