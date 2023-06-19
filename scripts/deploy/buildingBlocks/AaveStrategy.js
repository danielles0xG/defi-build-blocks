const hre = require("hardhat");
const { ethers } = require("hardhat");

const { UNISWAP_V2_BB,AAVE_BB,ACTION_POOL,LZ_ENDPOINTS,ASSETS } = require('../../../config/addresses.json');

async function main() {
      let network = hre.network.name;
      const AAVE_STRAT = await ethers.getContractFactory('AaveStrategy');
      const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET : ACTION_POOL.MAINNET;
      const initParams = ethers.utils.defaultAbiCoder.encode(
        [
          "address",
          "address",
          "address",
          "address"
        ],
        [
            ACTION_POOL_SELECT.ADDRESS,
            AAVE_BB.DC_BUILDING_BLOCK[network],
            UNISWAP_V2_BB.UNISWAP_V2.ROUTER[network],
            AAVE_BB.AAVE[network].POOL_ADDRESS_PROVIDER
        ]
      );

      const AaveStrategyInstance = await upgrades.deployProxy(
        AAVE_STRAT,[initParams ]
      );

      await AaveStrategyInstance.deployed();
      console.log("Aave Strategy Instance deployed to:", AaveStrategyInstance.address);
      console.log("Verifying "); 
      const contractAddress = AaveStrategyInstance.address;
      const implAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
      console.log("Aave Strategy Instance implementation: ", implAddress);
      // await upgrades.admin.transferProxyAdminOwnership(DEPLOYER);
       await hre.run("verify:verify", {
          address: implAddress,
      });
}
main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});