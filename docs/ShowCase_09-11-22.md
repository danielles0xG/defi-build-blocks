### Show case: 
1. Creating a strategy:

    a. From the relayer, a signal is sent via the entrypoint to the factory to create proxy contracts for GLP and for AAVE.
  Result: two proxy contract addresses

Aave_BB:
[Native trx](https://optimistic.etherscan.io/tx/34023032), [Destination tx](https://snowtrace.io/tx/0x8606cfa0f44286976fce23727cb4ca5691ce98e4ab3fa89bcc95313fb44ad590)
 
GMX_BB:
[Native trx](https://optimistic.etherscan.io/tx/35473560), [Destination tx](https://snowtrace.io/tx/0x760e0bc383ce66150419a6a24ebd2ec1422c749f2ce91fcf0688036c4ae9f78d)


2. Deposit funds to the strategy:

   a. [From the wallet in BSC, a deposit is made to the router for the created strategy trx](https://bscscan.com/tx/0x1372f94c32ab9244bb537a858f110579e465bfaaaf279b32f70f1706f9bb2613)

   b. The relayer checks the list of strategies and deposits that need to be bridged (Off-Chain)

   c. The relayer bridges half of the funds from the BSC router to the GLP proxy contract through the entrypoint:
    [Native trx](https://optimistic.etherscan.io/tx/35486506), [Destination trx](https://snowtrace.io/tx/0x1cd51582ab91ec054f9b875aa841ca76c55518e308282182c785a96e3cd59b3e)

   d. The relayer bridges half of the funds from the BSC router to the AAVE proxy contract through the entrypoint:
   [Native trx](https://optimistic.etherscan.io/tx/35465612), [Destination trx](https://snowtrace.io/tx/0x5e05067c222695b150976b7bad0515b75b6afe119a77c465cd1e0114b63889e9)


3. Strategy management:

   a. The relayer sends a signal through the entrypoint to the proxy to the GLP block to buy a GLP token for N money (in progress)

   b. The relayer sends a signal through the entrypoint to the proxy to the AAVE block to supply N money and borrow N/2 ETH and N/2 BTC for them  
   [Aave BB trx](https://layerzeroscan.com/111/address/0x47926fa934a34fc28bb1a1eaecef4c0fc2cee849/message/106/address/0x276271421128f39f3770f178bc8f2af01959fabe/nonce/32)


4. Withdrawals
   a. The user leaves a request for withdrawal on the BSC router trx:
    [Native trx](https://bscscan.com/tx/0x4eaf82a4cde8b71bba931ee7c35a29771fafa6e56d7e9a318ffd121875c9a2ce), 

   b. The relayer checks withdrawal requests and sees the user’s request: 
   [Native trx](https://optimistic.etherscan.io/tx/34072117), [Destination trx](https://bscscan.com/tx/0xd09f28a2d30d4fcb2e38f32e73ea13c087ffa0df6adb7c6c3af189627e94a91c)

   c. The relayer sends a signal through the entrypoint to reduce positions in blocks and the bridge of funds back to the router (in progress)

### ActionPool: 0x47926fa934a34fc28bb1a1eaecef4c0fc2cee849
### DcRouter: 0x89a0a701318c45a9b9edb3063b78d20a2f90696a
### Fabric: 0x88ad7c660c7e2ca11eb7fd104b35035a4c96eb0d
### AAve_bb: 0xa958ed2ab4e66206e76bbd2b78c27871f1db4a34
### GMX_bb: 0x5dC1D1dad8b6E7cFc49EDb4c62F8807b51CDA2Ff

#### set trusted fabric 
106 0x88ad7c660c7e2ca11eb7fd104b35035a4c96eb0d47926fa934a34fc28bb1a1eaecef4c0fc2cee849

#### set trusted Aave 
106 0xa958ed2ab4e66206e76bbd2b78c27871f1db4a3447926fa934a34fc28bb1a1eaecef4c0fc2cee849

#### set trusted GMX 
106 0x5dC1D1dad8b6E7cFc49EDb4c62F8807b51CDA2Ff47926fa934a34fc28bb1a1eaecef4c0fc2cee849

#### deposit 

#### bridge BSC to Aave
0.01
0x55d398326f99059fF775485246999027B3197955
10000000000000000000
106
Aave 0xa958ed2ab4e66206e76bbd2b78c27871f1db4a34 / GMX 0x5dC1D1dad8b6E7cFc49EDb4c62F8807b51CDA2Ff
0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
102
0x89a0a701318c45a9b9edb3063b78d20a2f90696a
700000
6000000000000000

#### scripts
npx hardhat run scripts/AavePerform.js --network optimism
npx hardhat run scripts/GmxPerfrorm.js --network optimism

#### aave deploy params
'0.01'
'2'
'0x86Bb530eAB484FF8b094537A4FA256D0553B6AD6'
'0x000000000000000000000000a97684ead0e402dc232d5a977953df7ecbab3cdb0000000000000000000000006f143fe2f7b02424ad3cad1593d6f36c0aab69d7000000000000000000000000929ec64c34a17401f460460d4b9390518e5b473e00000000000000000000000047926fa934a34fc28bb1a1eaecef4c0fc2cee849000000000000000000000000000000000000000000000000000000000000006f0000000000000000000000003c2269811836af69497e5f486a85d7316753cf62000000000000000000000000000000000000000000000000000000000000006a000000000000000000000000b97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
'106'
'0x88ad7c660c7e2ca11eb7fd104b35035a4c96eb0d'
'1500000'

#### gmx deploy param
'0.01'
'3'
'0xe88bce8597d29e375f901e3468e81fe26208db1b'
'0x0000000000000000000000009ab2de34a33fb459b538c43f251eb825645e859500000000000000000000000082147c5a7e850ea4e28155df107f2590fd4ba32700000000000000000000000047926fa934a34fc28bb1a1eaecef4c0fc2cee849000000000000000000000000000000000000000000000000000000000000006f0000000000000000000000003c2269811836af69497e5f486a85d7316753cf62000000000000000000000000000000000000000000000000000000000000006a000000000000000000000000b97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
'106'
'0x88ad7c660c7e2ca11eb7fd104b35035a4c96eb0d'
'1500000'

#### Init Withdraw

#### Bridge AAve to BSC
0.01
0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
9900000
102
0x89a0a701318c45a9b9edb3063b78d20a2f90696a
0x55d398326f99059fF775485246999027B3197955
106
Aave 0xa958ed2ab4e66206e76bbd2b78c27871f1db4a34 / GMX 0x5dC1D1dad8b6E7cFc49EDb4c62F8807b51CDA2Ff
700000
10000000000000000

#### approve deposit
 0.01
 0x468dcaf75744703d6191D0299e712FD121b77856
 1000000000000000000
2
102
 0x89a0a701318c45a9b9edb3063b78d20a2f90696a
700000
