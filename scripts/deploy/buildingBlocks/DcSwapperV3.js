const hre = require("hardhat");
const { ethers, upgrades} = require("hardhat");
const {
    UNISWAP_V3_BB,
    ACTION_POOL,
    LZ_ENDPOINTS,
    ASSETS,
  } = require("../../../config/addresses.json");

async function main(){
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    let network = hre.network.name;
    const DcSwapperV3 = await ethers.getContractFactory('DcSwapperV3');
    const initParams = ethers.utils.defaultAbiCoder.encode(
        [
          "address",
          "address",
          "address",
          "address",
          "address",
          "uint16",
          "uint16",
          "uint24[]",
        ],
        [
          UNISWAP_V3_BB.UNISWAP_V3.ROUTER[network],
          UNISWAP_V3_BB.UNISWAP_V3.QUOTER[network],
          ACTION_POOL.MAINNET.ADDRESS,
          LZ_ENDPOINTS[network].ADDRESS,
          ASSETS.USDC[network],
          ACTION_POOL.MAINNET.ID,
          LZ_ENDPOINTS[network].ID,
          [100, 500, 3000, 10000],
        ]
      );
    const dcSwapperV3 = await upgrades.deployProxy(DcSwapperV3,[initParams]);
    await dcSwapperV3.deployed();

    console.log("DcSwapperV3 deployed to:", dcSwapperV3.address);
    console.log("Verifying ");
    const contractAddress = dcSwapperV3.address;
    const implAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
    console.log("DcSwapperV3 implementation: ", implAddress);
    await dcSwapperV3.transferOwnership(deployer.address);
       await hre.run("verify:verify", {
          address: implAddress,
      });
}
main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});