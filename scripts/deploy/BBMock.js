const hre = require("hardhat");
const { upgrades, ethers} = require("hardhat");
const {LZ_ENDPOINTS, ACTION_POOL} = require("../../config/addresses.json");

async function main() {
    console.log('Running deploy script');
    const network = hre.network.name;
    const BB_CONTRACT = await hre.ethers.getContractFactory("BBMock");
    const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET : ACTION_POOL.MAINNET;
    const defaultEncoder =  ethers.utils.defaultAbiCoder;
    const initParams = defaultEncoder.encode(
        [
            "address",
            "address",
            "uint16",
        ],
        [
            LZ_ENDPOINTS[network].ADDRESS,
            ACTION_POOL_SELECT.ADDRESS,
            ACTION_POOL_SELECT.ID,
        ]
    );
    const somethingBB = await upgrades.deployProxy(BB_CONTRACT, [initParams],
        {
            kind: "uups",
            initializer: "initialize",
        }
    );


    console.log("BB Mock deployed to:", somethingBB.address);
    console.log("Verifying BB Mock");
    let bbImplAddress = await upgrades.erc1967.getImplementationAddress(somethingBB.address);
    console.log("BB Mock implementation: ", bbImplAddress);

    await hre.run("verify:verify", {
        address: bbImplAddress,
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
