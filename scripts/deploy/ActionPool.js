const hre = require("hardhat");
const {LZ_ENDPOINTS,DE_COMMAS_REGISTER} = require("../../config/addresses.json");

async function main() {
    console.log('Running deploy script');
    const network = hre.network.name
    const relayer = DE_COMMAS_REGISTER;
    const ACTION_POOL_CONTRACT = await hre.ethers.getContractFactory("ActionPoolDcRouter");
    const actionPoolContract = await ACTION_POOL_CONTRACT.deploy(
            DE_COMMAS_REGISTER,
            LZ_ENDPOINTS[network].ADDRESS,
            LZ_ENDPOINTS[network].ID,
            relayer
        );

    console.log("ACTION_POOL_CONTRACT deployed to:", actionPoolContract.address);
    console.log("Verification string: npx hardhat verify ",
        actionPoolContract.address,
        DE_COMMAS_REGISTER,
        LZ_ENDPOINTS[network].ADDRESS,
        LZ_ENDPOINTS[network].ID,
        relayer,
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
