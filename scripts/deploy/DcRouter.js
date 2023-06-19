const hre = require("hardhat");
const {LZ_ENDPOINTS,ACTION_POOL,BRIDGES,DE_COMMAS_REGISTER} = require("../../config/addresses.json");

// test wallet
async function main() {
    console.log('Running deploy script');
    const network = hre.network.name;

    const DC_ROUTER_CONTRACT = await hre.ethers.getContractFactory("DcRouter");
    const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET : ACTION_POOL.MAINNET

    const dcRouterContract = await DC_ROUTER_CONTRACT.deploy(
      DE_COMMAS_REGISTER,
      LZ_ENDPOINTS[network].ID,
      LZ_ENDPOINTS[network].ADDRESS,
      BRIDGES[network].USDC,
      ACTION_POOL_SELECT.ADDRESS,
      ACTION_POOL_SELECT.ID
    );
    await dcRouterContract.deployed();

    console.log("DC_ROUTER_CONTRACT deployed to:", dcRouterContract.address);

    await dcRouterContract.setTrustedRemoteAddress(ACTION_POOL_SELECT.ID, ACTION_POOL_SELECT.ADDRESS);
    await dcRouterContract.setBridge(BRIDGES[network].Bridge);

    console.log("Verification string: npx hardhat verify ",
        dcRouterContract.address,
        DE_COMMAS_REGISTER,
        LZ_ENDPOINTS[network].ID,
        LZ_ENDPOINTS[network].ADDRESS,
        BRIDGES[network].USDC,
        ACTION_POOL_SELECT.ADDRESS,
        ACTION_POOL_SELECT.ID,
        " --network ",
        network
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
