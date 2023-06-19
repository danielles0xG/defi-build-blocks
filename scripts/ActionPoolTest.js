const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Running deploy script");

  this.ActionPool = await hre.ethers.getContractFactory("ActionPoolDcRouter");
  const actionPool = await this.ActionPool.attach(
    "0x08DdFAA0ae134b7E6Af3D3FcB9e50dEe4b72B2Aa"
  );

  // const DEPLOYER = "0x9F4e3682643971dd336BE7b456ba52f070aeDfb9";

  // const [owner, otherAccount] = await ethers.getSigners();
  // 0x8E0eeC5bCf1Ee6AB986321349ff4D08019e29918
  // const USER = otherAccount.address;
  const USER = "0x9F4e3682643971dd336BE7b456ba52f070aeDfb9";
  // await owner.sendTransaction({
  //     to: USER,
  //     value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
  // });

  // await hre.network.provider.request({
  //     method: "hardhat_impersonateAccount",
  //     params: [DEPLOYER],
  // });
  // let deployer = await ethers.getSigner(DEPLOYER)
  // await actionPool.connect(deployer).setSwapper(swapper.address);
  //
  // await hre.network.provider.request({
  //     method: "hardhat_stopImpersonatingAccount",
  //     params: [DEPLOYER],
  // });

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [USER],
  });
  const signer = await ethers.getSigner(USER);
  console.log((await signer.getBalance()).toString());

  console.log("Bridging");

  // let fee = await actionPool.connect(signer).estimateGasFee(
  //     "0x0000000000000000000000000000000000000000",
  //     Optimism.chainId,
  //     USER
  // );
  // console.log("Fee is: " + fee);
  await actionPool
    .connect(signer)
    .performAction(
      "11",
      2,
      1,
      "0x135a3F1FFe7092E5F77CaF62f499032734D2a330",
      "0x0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000846b0365c300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000",
      "0x00010000000000000000000000000000000000000000000000000000000000030d40",
      { value: "150000000000000000" }
    );

  console.log((await signer.getBalance()).toString());

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [USER],
  });
}

main().catch((error) => {
  throw error;
});
