const hre = require("hardhat");
const {
    LZ_ENDPOINTS, REGISTRY, ACTION_POOL
} = require('../../config/addresses.json');

async function main() {
    console.log('Running deploy script');
    const network = hre.network.name
    const STRATEGY_REGISTRY = await await hre.ethers.getContractFactory("StrategyRegistry");
    const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ?
        ACTION_POOL.TESTNET : ACTION_POOL.MAINNET;
    const CHAIN_ID_BITMAP = REGISTRY.TESTNET.NETWORKS.includes(network) ?
        REGISTRY.TESTNET.CHAIN_IDS : REGISTRY.MAINNET.CHAIN_IDS;
    const CHAINS_COUNT = REGISTRY.TESTNET.NETWORKS.includes(network) ?
        REGISTRY.TESTNET.CHAIN_AMOUNT : REGISTRY.MAINNET.CHAIN_AMOUNT;
    const registry = await STRATEGY_REGISTRY.deploy(
        CHAINS_COUNT,
        CHAIN_ID_BITMAP,
        LZ_ENDPOINTS[network].ID,
        LZ_ENDPOINTS[network].ADDRESS,
        ACTION_POOL_SELECT.ADDRESS,
        ACTION_POOL_SELECT.ID,
    );
    await registry.deployed();
    console.log("StrategyRegistry deployed to:", registry.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
