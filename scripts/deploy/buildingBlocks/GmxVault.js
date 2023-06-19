const hre = require("hardhat");
const { ethers, upgrades} = require("hardhat");

const {
  GMX_BB, ACTION_POOL, ASSETS, LZ_ENDPOINTS
} = require('../../../config/addresses.json');

async function main() {
    let network = hre.network.name;

      const GMX_VAULT = await ethers.getContractFactory('GmxVault');
      const defaultEncoder =  ethers.utils.defaultAbiCoder;
      const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET : ACTION_POOL.MAINNET;

      const initParams = defaultEncoder.encode(
        ["address","address","address","uint16","address","uint16","address"],
        [GMX_BB.GMX.VAULT[network], 
         GMX_BB.GMX.REWARD_ROUTER[network],
         ACTION_POOL_SELECT.ADDRESS,
         ACTION_POOL_SELECT.ID,
         LZ_ENDPOINTS[network].ADDRESS,
         LZ_ENDPOINTS[network].ID,
         ASSETS.USDC[network]
    ]);
    
        const GmxVaultInstance = await upgrades.deployProxy(GMX_VAULT,[initParams]);
        await GmxVaultInstance.deployed();
        console.log("GmxVaultInstance deployed to:", GmxVaultInstance.address);
        console.log("Verifying ");
        const contractAddress = GmxVaultInstance.address;
        const implAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
        console.log("GmxVaultInstance implementation: ", implAddress);
        // await upgrades.admin.transferProxyAdminOwnership(DEPLOYER);
         await hre.run("verify:verify", {
            address: implAddress,
        });
}

async function upgrade(){
    const GmxVaultInstance_latest = " ";
    const GmxVault = await hre.ethers.getContractFactory("GmxVault");

    console.log("Preparing upgrade...");

    const upgraded = await upgrades.upgradeProxy(GmxVaultInstance_latest, GmxVault);
    console.log("GmxVaultInstance_latest upgraded with ", upgraded.address);

    console.log("Verifying ");
    const contractAddress = upgraded.address;
    const implAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
    console.log("GmxVaultInstance_latest implementation: ", implAddress);

    await hre.run("verify:verify", {
        address: implAddress,
    });
}

main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});
