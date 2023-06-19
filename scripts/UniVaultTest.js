const hre = require("hardhat");

const { ethers } = require("hardhat");

async function main() {
  console.log("Running deploy script");

  this.UniVault = await hre.ethers.getContractFactory("UniswapVault");
  this.ERC20 = await ethers.getContractFactory("ERC20");
  const usdt = this.ERC20.attach("0xc2132d05d31c914a87c6611c10748aeb04b58e8f");

  // const uniVault = await this.UniVault.deploy();
  // await uniVault.initialize(
  //     STRATEGY_ROUTER_OPTIMISM, //fixme
  //     UNISWAP_V3_OPTIMISM,
  //     "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", //USDT polygon
  //     "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // WETH polygon
  //     3000, // feeToPair_
  //     0, // swap tx timeout
  //     0 // sqrtPriceLimitX96toUni_
  // );

  const uniVault = await this.UniVault.attach(
    "0xB46b06a7913800e3797B4089560352d5a4470072"
  );

  // const DEPLOYER = "0x9F4e3682643971dd336BE7b456ba52f070aeDfb9";

  const [owner] = await ethers.getSigners();
  // 0x8E0eeC5bCf1Ee6AB986321349ff4D08019e29918
  // const USER = otherAccount.address;
  const USER = "0x8E0eeC5bCf1Ee6AB986321349ff4D08019e29918";
  await owner.sendTransaction({
    to: USER,
    value: ethers.utils.parseEther("50.0"), // Sends exactly 1.0 ether
  });

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

  await usdt.connect(signer).transfer(uniVault.address, "2000000");

  console.log((await signer.getBalance()).toString());
  console.log((await uniVault.getReserve()).toString());
  console.log("Bridging");

  // await uniVault.connect(signer).lzReceive(
  //     "6",
  //     "0x08DDFAA0AE134B7E6AF3D3FCB9E50DEE4B72B2AA",
  //     2,
  //     "0xac16d6ac0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000135a3f1ffe7092e5f77caf62f499032734d2a3300000000000000000000000000000000000000000000000000000000000030d402ef156dc45a90035e381e16a872eef6e7bb7fb4393a9acce8704eecc58daf34c00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000ac000000000000000000000000000000000000000000000000000000000000000062ef156dc45a90035e381e16a872eef6e7bb7fb4393a9acce8704eecc58daf34c00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000a4000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000053f851a0951ed5d031fc10bbb204c662f7278fdc112e3a4be053db1185b6316eeca54e0b80808080808080a0eeb6d01d5cd5d721ce004cdf4a1805bc38f1b7cc4fa7a7803c2b06ee7f6a970980808080808080800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b3f8b180a0b1f756128098ab7baa86052b52b72da2aae63119beb6491d7a6239c77247bd79a00b3c6dc9015530a580591b90db759217d313a0531461136dadff11e248e26134a0724197f4f6226e73ead46216d1541f4efc5555522fac392182229b28b4c493bda0063fd68175a6b401a654f3db7b7f2bebdbb264132bb2a4d36fa107d95beabbeca0cb03bb32f197983dd6c59ceea89596ad8c1cd8d13cda418bbf4e6bdf5f48b1148080808080808080808080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000787f9078420b9078002f9077c01831a3d24b9010000008000002000000000004000000000000000000000400000000000000000000004000000000000100000040000000000000000000000000000000001000000000000000000000000000000008000000000000000000000000000000800000000000000000000040000000002000000000000000000000000000000000000000000002000000000000000000000000000400000000000000000000000000200000000000000000000000000000000800000000000000000000000000000001000000000000000000000000080000000000000080000080000000000000000000000000000800000000000000000000000000000000000000000000000000000f90671f901199466a71dcef29a0ffbdbe3c6a460a3b5bc225cd675e1a0b8a7262132db1f61626604a31c3de81dc1a5bb0f1511dfa70d626ab1b88b52c2b8e0000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000002200010000000000000000000000000000000000000000000000000000000000030d40000000000000000000000000000000000000000000000000000000000000f901da9466a71dcef29a0ffbdbe3c6a460a3b5bc225cd675e1a0e8d23d927749ec8e512eb885679c2977d57068839d8cca1a85685dbbea0648f6b901a0000000000000000000000000000000000000000000000000000000000000000b00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000130000000000000000208ddfaa0ae134b7e6af3d3fcb9e50dee4b72b2aa135a3f1ffe7092e5f77caf62f499032734d2a3300000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000846b0365c300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f89994a5d70d7cc79cd83f022e7fec06da7e1b93d772e9e1a0f5f7eeb9c1ffb10aced9d0a5354641e9bccdde560963d05f8d26ad4a460c89a2b860000000000000000000000000000000000000000000000000000000000000000b0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000cf902da9408ddfaa0ae134b7e6af3d3fcb9e50dee4b72b2aae1a072ef02922566e597d331cc6e90dc44559013968ffbc4ead91e22749b963c0a04b902a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000014135a3f1ffe7092e5f77caf62f499032734d2a33000000000000000000000000000000000000000000000000000000000000000000000000000000000000000846b0365c300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000846b0365c300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000001",
  //     );
  //
  await signer.sendTransaction({
    to: uniVault.address,
    data: "0x6b0365c300000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000f4240",
  });

  console.log((await uniVault.getReserve()).toString());
  console.log((await signer.getBalance()).toString());

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [USER],
  });
}

main().catch((error) => {
  throw error;
});