## Bridge tokens to other chain's Vault
Transfer stable tokens to target chain over stargateBridge

```asciidoc
bridge(flag, actionData, receiverId, receiverAddress, gasAmount, nativeForDst);
```

#### flag - only 1

#### actionData - encoding data for SgBridge.bridge()

```
abi.encode(
        nativeStableToken - stable token on the native chain, optional currentUSDCToken
        stableAmount - how many tokens are you sending (6 or 18 decimals)
        vaultLZId - target lzId
        vaultAddress - target address for bridge
        destinationStableToken - stable token on the target chain
)
```

#### receiverId - target chain id in LayerZero, see more: (https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses)
```
10001
```

#### receiverAddress - recipient address of stable tokens in the target chain 
```
0xRouter || 0xBB
```
#### gasAmount -  version=2, gasAmount=500000, how max gas need to transaction
```
100000000000000000
```
#### nativeForDst - how much to native gas need to delivered for destination address for call to payable function
```
0x9D0B8b5B6533581a2109dA29e073189cD6ab40Bc
```
```
      "bridge": [
        {
           "name": "flag",
          "type": "uint16"
        },
        {
           "name": "actionData",
          "type": "bytes"
        },
        {
           "name": "receiverId",
          "type": "uint16"
        },
        {
           "name": "receiverAddress",
          "type": "bytes"
        },
        {
           "name": "gasAmount",
          "type": "uint256"
        },
        {
           "name": "nativeForDst",
          "type": "uint256"
        }
      ]
```

for feeAmount calculate use this:
```asciidoc
LZEndpoint.estimateFees(nativeId,vault,payload,false,adapterParams);

adapterParams = abi.encodePacked(2, 500000, destinationGas, destinationAddress);
```
#### generate events:
PerformedBridge(destination, data)
Bridged(vaultLZId, vaultAddress, stableAmount);


## Single Action to BB/Router
performAction(receiverId, flag, strategyId, receiverAddress, actionData, gasAmount);

Performing the function of a building block in the target chain and passing a message to it

#### receiverId - target chain id in LayerZero, see more: (https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses)
```
10001 - rinkeby lzId
```
#### flag - special flag for lzReceive in DcRouter or BuildingBlock()
```
2
```
#### strategyId - strategy identificator in destination address for event
```
1
```
#### receiverAddress - address of router or bb in destionation chain, when need to call action function

```
0x9D0B8b5B6533581a2109dA29e073189cD6ab40Bc
```
#### actionData - destination bb or router func signature with selector encoded in bytes 

abi.encodeWithSelector(borrow(bytes a)) , when a = abi.encode(address(0xd9145CCE52D386f254917e481eB44e9943F39138), uint256(100000000)
```
0x9f1b472000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9145cce52d386f254917e481eb44e9943f391380000000000000000000000000000000000000000000000000000000005f5e100
```
#### gasAmount -  etc version=1, gasAmount=500000, how max gas need to transaction
```
      "performAction": [
        {
          "name": "receiverId",
          "type": "uint16"
        },
        {
          "name": "flag",
          "type": "uint16"
        },
        {
          "name": "strategyId",
          "type": "uint256"
        },
        {
          "name": "receiverAddress",
          "type": "bytes"
        },
        {
          "name": "actionData",
          "type": "bytes"
        },
        {
          "name": "gasAmount",
          "type": "uint256"
        }
      ]
```

```
actionPool.performAction(10001, 
                        2,
                        1,
                        0x9D0B8b5B6533581a2109dA29e073189cD6ab40Bc,
                        0x9f1b472000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9145cce52d386f254917e481eb44e9943f391380000000000000000000000000000000000000000000000000000000005f5e100 -  )
)
```

#### generate event:
Adjusted(strategyId, destination, data)
### Example
```json
{
  "payableAmount": "0.2", 
  "receiverId": "10001",
  "flags": "2",
  "strategyId": "1",
  "receiverAddresses": "0x1f9d0279DB0f4F4AD4AAEA7724CdbAfEB972E0f9",
  "actionData": "0x9f1b472000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9145cce52d386f254917e481eb44e9943f391380000000000000000000000000000000000000000000000000000000005f5e100",
  "gasAmountsForAdapters": "500000"
}
```
```
actionData = abi.encodeWithSelector(borrow(bytes(address, uint256)))
```
#### generate event:
Adjusted(strategyId, destination, data)


## Multi Call Action
multiPerformAction([]receiverIds, []flags, strategyId, []receiverAddresses, []actionData, []gasAmounts)
```
      "multiPerformAction": [
        {
          "name": "receiverIds",
          "type": "uint16[]"
        },
        {
          "name": "flags",
          "type": "uint16[]"
        },
        {
          "name": "strategyId",
          "type": "uint256"
        },
        {
          "name": "receiverAddresses",
          "type": "bytes[]"
        },
        {
          "name": "actionData",
          "type": "bytes[]"
        },
        {
          "name": "gasAmounts",
          "type": "uint256[]"
        }
      ]
```

### Example
```json
{
  "payableAmount": "0.2", 
  "receiverIds": "[10001,10001]",
  "flags": "[2,2]",
  "strategyId": "1",
  "receiverAddresses": "[0x1f9d0279DB0f4F4AD4AAEA7724CdbAfEB972E0f9,0x63406498d9c8f586763366f5AB92f49FCd612553]",
  "actionData": "[0x9f1b472000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9145cce52d386f254917e481eb44e9943f391380000000000000000000000000000000000000000000000000000000005f5e100,0x9f1b472000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d9145cce52d386f254917e481eb44e9943f391380000000000000000000000000000000000000000000000000000000005f5e100]",
  "gasAmounts": "[500000,500000]"
}
```

#### generate event:
Adjusted(strategyId, destination, data)


## Approve to withdraw
ActionPool address outputs the user's funds

_approveWithdraw(actionData)

actionData - encoded params:
```
abi.encode(
            user - list of user's addresses
            stableDeTokenPrice - wei price of TVL - comming soon
            arrayNum - number of allPendingData Array
            strategyId - strategy number by which it will be identified
)
```
#### generate event:
Withdrawn(user, id, stableWithdraw)


## Cancel to withdraw
ActionPool address outputs the user's funds

_cancelWithdraw(actionData);

actionData - encoded params:
```
abi.encode(
            user - list of user's addresses
            stableDeTokenPrice - wei price of TVL - comming soon
            arrayNum - number of allPendingData Array
            strategyId - strategy number by which it will be identified
)
```

#### generate event:
CancelWithdrawn(user, id, stableWithdraw)