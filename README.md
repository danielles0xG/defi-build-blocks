# Manage cross chain positions

Building block contracts for cross chain index.

  
**Integrations**
- Perpetual protocol
- Gmx
- Aave
- Uniswap v3
---
  All state changing interactions with the DcPerpetualVault are made through the DeCommasStrategyRouter contract, therefore calls to DcPerpetualVault must be encoded into bytes and are only callable by the router with the function `adjustPosition` on the DeCommasStrategyRouter contract.

```asciidoc
  function adjustPosition(uint256 strategyId,
                            uint16 vaultLZId,
                            address vaultAddress,
                            string memory func,
                            bytes memory actionData)
```
**The bytes action data params are the ones to adapt for each specific call to the DcPerpetualVault.**
## DcPerpetualVault contract:
- `Deposit USDC` into DcPerpetualVault
    - Note: this function will be used when no cross chain interaction is needed, when router and vault are on the same chain.
```asciidoc
depositUSDC(bytes memory _data)
        (uint256 amount) = abi.decode(_data, (uint256));
```
- `Direct deposit` into Perpetual protocol vault
```asciidoc
directDepositToVault(bytes memory _data)
        (uint256 amount) = abi.decode(_data, (uint256));
```
- `Open long position`
    - operationType : true for open position
    - positionType : false for long position
    - amount :  position amount
```asciidoc
adjustPosition(bytes memory _data)
    (bool operationType, bool positionType, uint256 amount) = abi.decode(_data,(bool,bool,uint256));
```
- `Open short position`
    - operationType : true for open position
    - positionType : true for short position
    - amount :  position amount
```asciidoc
adjustPosition(bytes memory _data)
    (bool operationType, bool positionType, uint256 amount) = abi.decode(_data,(bool,bool,uint256));
```
- `Close position`
    - operationType : false for closing position
    - positionType : false for closing
    - amount :  position amount to close
```asciidoc
adjustPosition(bytes memory _data)
    (bool operationType, bool positionType, uint256 amount) = abi.decode(_data,(bool,bool,uint256));
```
- `WithdrawUSDC` for native chain withdrawals
    - amount : amount to withdraw
```asciidoc
withdrawUSDC(bytes memory _data)
    (uint256 amount) = abi.decode(_data,(uint256));
```

- `BridgeToRouterBack` for cross chain withdrawals
    - vaultLZId:  LayerZero chain Id
    - nativeStableToken:  Token address to rbidge
    - destinationStableToken:  Destination token address to redeem bridged asset
    - sgBridge:  Star Gate bridge address
    - targetRouter:  Target remote router address
    - stableAmount:  amount to wirhdraw
```asciidoc
bridgeToRouterBack(bytes memory _data) external payable{
        (uint16 vaultLZId,
        address nativeStableToken,
        address destinationStableToken,
        address sgBridge,
        address targetRouter,
        uint256 stableAmount) = abi.decode(_data, (uint16, address, address, address, address, uint256));
```
## Public methods:
    - getReserve() : uint256 - USDC on the strategy balance
    - nativeStrategyTokenPrice() : uint256 price of underlying perp asset [1e6]
    - getTotalUSDCValue() : uint256 - USDC position value
    - getDailyMarketTwap() : uint256 - time weighted price average
    - poolLimit() : uint256 - contract pool limit for deposits
    - getCurrentFundingRate() : uin256 - Current funding rate for the perpV2
# Transaction showcase

- Deposit & bridge into strategy router BSC
https://bscscan.com/address/0xC052e0c6AB6a72db67A837f9e0261b45Cb09fb6F

https://bscscan.com/tx/0xa9ab527f4a60b66b454fcc72b814a9b362ad34a4ba7591f032b176db1383b257
https://optimistic.etherscan.io/tx/0xa9637d9ded2bc949b7113c808360237d8d6960822f269087320cc17bac575a6f

- Open short position BSC/Optimismx
 https://bscscan.com/tx/0x02d92b336a849cba6cc8ccb76998a96048f1bf7a412259a1184c49dcfb36fac3
 https://kovan-optimistic.etherscan.io/tx/0xafbc8f442936b44e287a848b534e81b1873cc25b9aa838d4a02276703df969e9


- Open long position BSC/Optimism
https://bscscan.com/tx/0xb0b2db98b0d5b0c78a8e47af0fdff7367db1e42024e8d5665bdffb2f6fd0b14b
https://optimistic.etherscan.io/tx/0x19564f1f5df30c99565e3fcb67b9c3b81729f1ed3e65c9fdb77cdce2268c9b35


Full CLose (withdraw)

Stuck out of gas tx
https://optimistic.etherscan.io/tx/0x81668f1909fc5ee4158e5887a1a8177a5ee1f8f63ee0b148a000405d7978de37#eventlog

https://optimistic.etherscan.io/tx/0x64d56fde15dc87b8c8a6733e35c247b420007579878483bc3bc3f6929411e6db

**Perpetuals**

Src Chain BSC router 
https://bscscan.com/address/0xC052e0c6AB6a72db67A837f9e0261b45Cb09fb6F

Open Short Position
https://optimistic.etherscan.io/tx/0x4d9237dd63703c33158f6a44621b769a0af674b7c0fc926be5b8f0fe71be0502



Full CLose Position

Stuck out of gas tx
https://optimistic.etherscan.io/tx/0x81668f1909fc5ee4158e5887a1a8177a5ee1f8f63ee0b148a000405d7978de37#eventlog
https://optimistic.etherscan.io/tx/0x64d56fde15dc87b8c8a6733e35c247b420007579878483bc3bc3f6929411e6db


Second Short Position

https://optimistic.etherscan.io/tx/0xfef11c7a8a9a64b1877be70709641801a597e9674b70e081ba5cb79b509dd16c
