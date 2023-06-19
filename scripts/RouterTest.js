const hre = require("hardhat");
const { ethers } = require("hardhat");

async function init() {
  this.defaultEncoder = ethers.utils.defaultAbiCoder;
  this.dcRouter = await hre.ethers.getContractAt(
    "DcRouter",
    "0xcD819d59B019955374C9f3d43B6AE568Fe89F4c6"
  );
}
async function transferDeposit(
  user,
  destLzId,
  receiver,
  amount,
  strategyId,
  strategyTvl
) {
  const BNB_USDT = "0xF49E250aEB5abDf660d643583AdFd0be41464EfD";

  const actionData = this.defaultEncoder.encode(
    ["uint16[]", "address[]", "uint256[]", "address[]", "uint256", "uint256"],
    [[destLzId], [receiver], [amount], [BNB_USDT], strategyId, strategyTvl]
  );

  await this.dcRouter.transferDeposits(actionData);
}

async function perform() {
  await init();

  console.log("Starting interaction with DcRouter");

  const USER = "0x8e0eec5bcf1ee6ab986321349ff4d08019e29918";
  await transferDeposit(USER, 10102, USER, 1000000, 102, 2000000);
}

perform()
  .then(() => {
    console.log("Finished successfully");
  })
  .catch((error) => {
    console.error(error);
    throw Error;
  });
