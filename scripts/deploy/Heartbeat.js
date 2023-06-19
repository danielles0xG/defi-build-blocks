const hre = require("hardhat");
const { ethers} = require("hardhat");

async function main(){
    const Heartbeat = await ethers.getContractFactory('Heartbeat');
    const heartbeat = await Heartbeat.deploy(hre.ethers.constants.AddressZero);
    await heartbeat.deployed();

    console.log("heartbeat deployed to:", heartbeat.address);
    console.log("Verifying ");
    await hre.run("verify:verify", {
        address: heartbeat.address,
    });
}

main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});