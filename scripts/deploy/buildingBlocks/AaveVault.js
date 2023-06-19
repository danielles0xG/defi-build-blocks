const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");

const { UNISWAP_V2_BB,AAVE_BB,ACTION_POOL,LZ_ENDPOINTS,ASSETS } = require('../../../config/addresses.json');

async function main() {
      let network = hre.network.name;

      const AaveVaultContract = await ethers.getContractFactory('AaveVault');
      const defaultEncoder =  ethers.utils.defaultAbiCoder;

      // for aave's mintable test token
      const USDC_ADDRESS = ['fujiavax','polygonmumbai','optimismgoerli'].includes(network) ? 
            AAVE_BB.AAVE[network].USDC : ASSETS.USDC[network];
      const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET : ACTION_POOL.MAINNET;
      const initParams = defaultEncoder.encode(
        [
          "address",
          "address",
          "address",
          "address",
          "uint16",
          "address",
          "uint16",
          "address",
          "address"
        ],
        [
          AAVE_BB.AAVE[network].POOL_ADDRESS_PROVIDER,
          AAVE_BB.AAVE[network].WETH_GATEWAY,
          AAVE_BB.AAVE[network].REWARD_CONTROLLER,
          ACTION_POOL_SELECT.ADDRESS,
          ACTION_POOL_SELECT.ID,
          LZ_ENDPOINTS[network].ADDRESS,
          LZ_ENDPOINTS[network].ID,
          USDC_ADDRESS,
          UNISWAP_V2_BB.UNISWAP_V2.ROUTER[network]
        ]
      );

      const AaveVaultInstance = await upgrades.deployProxy(AaveVaultContract,[initParams]);

        await AaveVaultInstance.deployed();
        console.log("AaveVaultInstance deployed to:", AaveVaultInstance.address);
        console.log("Verifying ");
        const contractAddress = AaveVaultInstance.address;
        const implAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
        console.log("AaveVaultInstance implementation: ", implAddress);
        // await upgrades.admin.transferProxyAdminOwnership(DEPLOYER);
         await hre.run("verify:verify", {
            address: implAddress,
        });
}

async function upgrade(){
    const addressZero = ethers.constants.addressZero; 
    const LATEST_DEPLOY = addressZero
    const AaveVault = await hre.ethers.getContractFactory("AaveVault");

   // console.log('Force importing proxy');
  //  await upgrades.forceImport(BSC_ROUTER, DeCommasStrategyRouter);

    console.log("Preparing upgrade...");
    const DeCommasStrategyRouterV2 = await upgrades.prepareUpgrade(LATEST_DEPLOY, AaveVault);
    console.log("DeCommasStrategyRouterV2", DeCommasStrategyRouterV2);

    const upgraded = await upgrades.upgradeProxy(LATEST_DEPLOY, AaveVault);
    console.log("DeCommasStrategyRouter upgraded with ", upgraded.address);

    console.log("Verifying ");
    const contractAddress = upgraded.address;
    const implAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
    console.log("DcPerpetualVault implementation: ", implAddress);
    // await upgrades.admin.transferProxyAdminOwnership(PROXY_OWNER_KOVAN);
    await hre.run("verify:verify", {
        address: implAddress,
    });
}

main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});
// upgrade().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});