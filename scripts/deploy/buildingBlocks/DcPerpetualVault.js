const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
const { PERP_BB, ACTION_POOL, ASSETS, LZ_ENDPOINTS } = require('../../../config/addresses.json');
  
async function main() {
      const network = hre.network.name;
      const DcPerpetualVault = await ethers.getContractFactory('DcPerpetualVault');
      const ACTION_POOL_SELECT = ACTION_POOL.TESTNET.NETWORKS.includes(network) ? ACTION_POOL.TESTNET : ACTION_POOL.MAINNET;
      const defaultEncoder =  ethers.utils.defaultAbiCoder;
      const initParams = defaultEncoder.encode(
        [
          "address",
          "address",
          "address",
          "address",
          "address",
          "address",
          "address",
          "uint16",
          "uint16",
          "uint160"
        ],
        [
          LZ_ENDPOINTS[network].ADDRESS,
          ACTION_POOL_SELECT.ADDRESS,
          PERP_BB.PERP_PROTOCOL.CLEARING_HOUSE[network],
          PERP_BB.PERP_PROTOCOL.VAULT[network],
          ASSETS.USDC[network],
          ASSETS.WETH[network],
          ACTION_POOL_SELECT.ID,
          LZ_ENDPOINTS[network].ID,
          300
        ]
      );
        const dcPerpetualVault = await upgrades.deployProxy(DcPerpetualVault,[initParams]);
        await dcPerpetualVault.deployed();
        console.log("perpetualVault deployed to:", dcPerpetualVault.address);
        console.log("Verifying ");
        const contractAddress = dcPerpetualVault.address;
        const implAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
        console.log("DcPerpetualVault implementation: ", implAddress);
        // await upgrades.admin.transferProxyAdminOwnership(DEPLOYER);
         await hre.run("verify:verify", {
            address: implAddress,
        });
}

main().then(() => process.exit(0)).catch((error) => {console.error(error);process.exit(1);});
