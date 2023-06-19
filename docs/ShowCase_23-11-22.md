## SHOW CASES: 

### 1. Creating a strategy:
```
npx hardhat run scripts/action/initNewBB.js --network optimism
```

https://optimistic.etherscan.io/tx/0xc735210a05dd1429c6cc3f07b9b3cdc6987d4de545cf9d3b1227e46fbe9df43e
https://snowtrace.io/tx/0x4f8db1d5766fad3d6b820034debdab32667dfda799b10b6778643be3fe940131

https://optimistic.etherscan.io/tx/0x66a63c6f58d9a567d62f9644d218ac73c69084749747c016d64914394bbe24fa
https://snowtrace.io/tx/0x612b19070107ca054d541f2316a87fab321698f919346f958400cadf988f437es

### 2. Deposit funds to the strategy:

#### 2a. user's Deposit
```
npx hardhat run scripts/action/DepositProcess.js --network bsc_mainnet
```

https://bscscan.com/tx/0xa9bbbe5a4aaf28e644b8f7f6c4123c29458431c7a0b0a5d595e3737ab884adcc

#### 2b. Bridge Funds to Strategy
```
npx hardhat run scripts/action/BridgeToBB.js --network optimism
```

https://optimistic.etherscan.io/tx/0x66511360303022832c90601cbdbf6a24531238dddaee1cc68fa287f1ea5fd549
https://bscscan.com/tx/0x7285e3e3f923afef02b5add28c84f160989f188af470d1416252cd37427ef148
https://snowtrace.io/tx/0x16f7cb2f09cef1d2aa587c72c0c2c48d4d4f6de29e83c3b5bb1990123fda7a39

### 3. Strategy management:

#### 3a. Perform to Aave
```
npx hardhat run scripts/action/AavePerform.js --network optimism
```

https://optimistic.etherscan.io/tx/0x522be9f03ed81105863d38e6b39da1b3c6e1627220b49ada75639aeac6c7acfa
https://snowtrace.io/tx/0xaa71f6b25a2b0485858e5379e54e16c9210d00e907df98ef7952965c260170be

https://optimistic.etherscan.io/tx/0xbd0c95b2eff14ae3ff020a57d45f2bb3e0140a8a8cae9ed1b4fd256f5e0f553a
https://snowtrace.io/tx/0xa13fb340c4799fdfba3d57108d3c1835b6b9484bd2026ab85f37061173fe215b

https://optimistic.etherscan.io/tx/0x5706d2b34c4a3dd67b689b8d203e655c8717fb988776092023bbb62ca5e91c71
https://snowtrace.io/tx/0x28b02114349cd06ee83a63d10381e398e48cd4cc621932a369ebcdd6ffe62436

#### 3b. Perform to GMX
```
npx hardhat run scripts/action/GmxPerform.js --network optimism
```

### 4. Withdrawals

#### 4a. Init Withdraw
```
npx hardhat run scripts/action/WithdrawProcess.js --network bsc_mainnet
```
https://bscscan.com/tx/0x3e5900f4d66d8ca6499988c4c4c2ce9c850f5b776fae10cebd667d49ea8779f0

#### 4b. Bridge to Router and Approve Withdraw:
```
npx hardhat run scripts/action/BridgeToRouter.js --network optimism
```

https://optimistic.etherscan.io/tx/0x56289d1560d6fcd17b2dab66efb93c235d1d88676b4a0231326d048804757018
https://snowtrace.io/tx/0xc434dfda8ba50dd3130968c239add2699821259b20bb40bad05c2a31bd3c72cd
https://bscscan.com/tx/0xd97dcdb1776ceae842bb6948ba57116d0d92fb06a421e6db537c68af86e649cb

#### 4c. Approve Withdraw:
```
npx hardhat run scripts/action/ApproveWithdraw.js --network optimism
```

https://optimistic.etherscan.io/tx/0x4629668b03f12d6914e8acb1abb4c518f79c822dad24d281469bac56c621d240
https://bscscan.com/tx/0xfd654793349de5ba883d1c44cca850ceb60f06ec2fa5d83103aa424d01cf73b4