1. Init DE_COMMAS_REGISTER and RELAYER to config/addresses.json(PRODUCTION_NETWORKS)


2. add PROD_DEPLOYER_PRIVATE_KEY to process.env


3. Deploy ActionPool:

```
npx hardhat run deploy/prod/ActionPool.js --network optimism
```

4. init CURRENT_ACTION_POOL_ADDRESS to config/addresses.json(PRODUCTION_NETWORKS)


5. Deploy dcRouter

```
npx hardhat run deploy/prod/DcRouter.js --network polygon
```

6. Deploy BBFabric

```
npx hardhat run deploy/prod/BBFabric.js --network avalanche

```


7. Deploy BB implementation
```
npx hardhat run deploy/prod/  'BBImplementation'   .js  --network avalanche
```

8. Set trusted remote for all contracts
```
ActionPool.setTrustedRemote(106, BBFabric.address);
ActionPool.setTrustedRemote(109, DcRouter.address);
BBFabric.setTrustedRemote(111, ActionPool.address)
DcRouter.setTrustedRemote(111, ActionPool.address)
```

9. Init new BB
```
ActionPool.initNewBB(
1,
BBImplementation.address,
encodedParamsForBBConstructor,
106,
BBFabric.address,
1700000
);
```

10. Init basic introductory
```
DcRouter.setBridge(Bridge_Network_Address)
```