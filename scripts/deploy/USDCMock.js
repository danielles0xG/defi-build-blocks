const hre = require("hardhat");

async function main() {
    console.log('Running deploy script');
    const USDC = await hre.ethers.getContractFactory("USDCMock");
    const usdc = await USDC.deploy();
    console.log("usdc deployed to:", usdc.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });