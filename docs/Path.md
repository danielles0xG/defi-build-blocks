1. Deploy ActionPool
2. Deploy DcRouter
3. Deploy BBs
4. start strategy to dcRouter - ActionPool.performAction
5. deposit to router  router.deposit
6. ActionPool.bridge(1) => router.lzReceive(bridge to bb)
7. ActionPool.performAction(2, bb)
8. initiate Withdraw - bb.initiateWithdraw()
9. ActionPool.bridge(1) => bb.lzReceive(bridge to router)
10. Approve withdraw ActionPool.performAction(2 || 3, router)