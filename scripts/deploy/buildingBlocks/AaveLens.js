const hre = require("hardhat");
const { ethers } = require("hardhat");

const { AAVE_BB } = require('../../../config/addresses.json');

async function main() {
      let network = hre.network.name;
      const AaveLensContract = await ethers.getContractFactory('AaveLens');
      const AaveLensInstance = await AaveLensContract.deploy(
        AAVE_BB.AAVE[network].POOL_ADDRESS_PROVIDER,
        AAVE_BB.AAVE[network].REWARD_CONTROLLER
      );

        await AaveLensInstance.deployed();
        console.log("AaveLensInstance deployed to:", AaveLensInstance.address);
        console.log("Verify with hardhat verify --constructor-args arguments.js DEPLOYED_CONTRACT_ADDRESS");
}
main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});