const hre = require("hardhat");

async function main(){
    const Decoder = await hre.ethers.getContractFactory("Decoder");
    const decoder = await Decoder.deploy();
    await decoder.deployed();
    console.log('Decoder deployed to:', decoder.address);
    await hre.run("verify:verify", {
        address: decoder.address,
    });
}

main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});
