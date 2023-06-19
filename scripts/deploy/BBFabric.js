const hre = require("hardhat");
const {
    LZ_ENDPOINTS, ACTION_POOL, REGISTRY,
} = require('../../config/addresses.json');

async function main() {
    console.log('Running deploy script');
    const network = hre.network.name;
    const BB_FABRIC_CONTRACT= await await hre.ethers.getContractFactory("BBFabric");
    const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET : ACTION_POOL.MAINNET;
    const REGISTRY_SELECT = REGISTRY.TESTNET.NETWORKS.includes(network) ? REGISTRY.TESTNET : REGISTRY.MAINNET;
    const bbFabric = await BB_FABRIC_CONTRACT.deploy(
      LZ_ENDPOINTS[network].ID,
      LZ_ENDPOINTS[network].ADDRESS,
      ACTION_POOL_SELECT.ADDRESS,
      ACTION_POOL_SELECT.ID,
      REGISTRY_SELECT.ID,
      REGISTRY_SELECT.ADDRESS,
    );
    await bbFabric.deployed();
    console.log("BBFabric deployed to:", bbFabric.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
