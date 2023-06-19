// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

library DecodeHelper {
    function addressToBytes(address a) public pure returns (bytes memory b) {
        assembly {
            let m := mload(0x40)
            a := and(a, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
            mstore(
                add(m, 20),
                xor(0x140000000000000000000000000000000000000000, a)
            )
            mstore(0x40, add(m, 52))
            b := m
        }
    }

    function bytesToAddress(bytes memory bys)
        public
        pure
        returns (address addr)
    {
        assembly {
            addr := mload(add(bys, 20))
        }
    }

    function dataForVault(int256 p0) public pure returns (bytes memory) {
        return abi.encode(p0);
    }

    function dataForVault(address p0) public pure returns (bytes memory) {
        return abi.encode(p0);
    }

    function dataForVault(address p0, uint256 p1)
        public
        pure
        returns (bytes memory)
    {
        return abi.encode(p0, p1);
    }

    function dataForVault(
        bool p0,
        bool p1,
        uint256 p2
    ) public pure returns (bytes memory) {
        return abi.encode(p0, p1, p2);
    }

    function dataForVault(
        address p0,
        uint256 p1,
        address p2
    ) public pure returns (bytes memory) {
        return abi.encode(p0, p1, p2);
    }

    function dataForVault(
        address p0,
        address p1,
        uint16 p2
    ) public pure returns (bytes memory) {
        return abi.encode(p0, p1, p2);
    }

    function dataForVault(
        address p0,
        address p1,
        uint256 p2
    ) external pure returns (bytes memory) {
        return abi.encode(p0, p1, p2);
    }

    function dataForVault(
        uint256 p0,
        address p1,
        bytes memory p2
    ) public pure returns (bytes memory) {
        return abi.encode(p0, p1, p2);
    }

    function dataForVault(
        address p0,
        uint256 p1,
        uint16 p2,
        address p3,
        address p4
    ) public pure returns (bytes memory) {
        return abi.encode(p0, p1, p2, p3, p4);
    }

    function dataForVaultAaveDeposit(uint256 p0)
        public
        pure
        returns (bytes memory)
    {
        return abi.encode(p0);
    }

    function encodeAdjustPositionPerp(
        uint16 flag,
        string memory funcSignature,
        int256 p0
    ) public pure returns (bytes memory) {
        bytes memory _payload = abi.encodePacked(p0);
        bytes memory _functSignature = abi.encodeWithSignature(
            funcSignature,
            _payload
        );
        return abi.encode(flag, _functSignature);
    }

    function dataForVaultWithdraw(
        address p0,
        uint256 p1,
        address p2
    ) public pure returns (bytes memory) {
        return abi.encode(p0, p1, p2);
    }

    function dataForVault(uint256 p0, bool p1)
        public
        pure
        returns (bytes memory)
    {
        return abi.encode(p0, p1);
    }

    function decodeLZReceiveDATA(
        string memory func1,
        bytes memory _data,
        address dstVault
    ) public pure returns (bytes memory payloadToEndpoint1) {
        bytes memory funcSignature1 = abi.encodeWithSelector(
            bytes4(keccak256(bytes(func1))),
            _data
        );
        payloadToEndpoint1 = abi.encode(dstVault, funcSignature1);
    }

    function dataForVaultOpenPosAave(
        uint16 flag,
        string memory func1,
        address baseAsset,
        uint256 amount
    ) public pure returns (bytes memory payloadToEndpoint1) {
        bytes memory actionData = abi.encode(baseAsset, amount);
        bytes memory funcSignature1 = abi.encodeWithSelector(
            bytes4(keccak256(bytes(func1))),
            actionData
        );
        payloadToEndpoint1 = abi.encode(flag, funcSignature1);
    }

    function dataForVaultDepositAave(
        uint16 flag,
        string memory func1,
        address depositor,
        address baseAsset,
        uint256 amount
    ) public pure returns (bytes memory payloadToEndpoint1) {
        bytes memory actionData = abi.encode(depositor, baseAsset, amount);
        bytes memory funcSignature1 = abi.encodeWithSelector(
            bytes4(keccak256(bytes(func1))),
            actionData
        );
        payloadToEndpoint1 = abi.encode(flag, funcSignature1);
    }

    function dataForVaultAaveBorrowPayload(
        uint16 flag,
        string memory func1,
        address collateralAsset,
        uint256 amount
    ) public pure returns (bytes memory payloadToEndpoint1) {
        bytes memory actionData = abi.encode(collateralAsset, amount);
        bytes memory funcSignature1 = abi.encodeWithSelector(
            bytes4(keccak256(bytes(func1))),
            actionData
        );
        payloadToEndpoint1 = abi.encode(flag, funcSignature1);
    }

    function dataForVaultAaveCollateral(
        uint16 flag,
        string memory func1,
        address collateralAsset
    ) public pure returns (bytes memory payloadToEndpoint1) {
        bytes memory actionData = addressToBytes(collateralAsset);
        bytes memory funcSignature1 = abi.encodeWithSelector(
            bytes4(keccak256(bytes(func1))),
            actionData
        );
        payloadToEndpoint1 = abi.encode(flag, funcSignature1);
    }

    function getBytes(address _asset, uint256 _b)
        public
        pure
        returns (bytes memory)
    {
        return abi.encode(_asset, _b);
    }

    function decodePayload(bytes memory payloadToEndpoint1)
        public
        pure
        returns (address vault, bytes memory funcSignature)
    {
        (vault, funcSignature) = abi.decode(
            payloadToEndpoint1,
            (address, bytes)
        );
    }

    function callToMockWithData(bytes memory payloadToEndpoint1)
        public
        returns (bytes memory)
    {
        (address vault, bytes memory funcSign) = decodePayload(
            payloadToEndpoint1
        );
        (bool success, bytes memory returnData) = address(vault).call(funcSign);
        require(success, "DecodeHelper:call to vault failed");
        return returnData;
    }

    function callMockWithPayload(address vault, bytes memory funcSignature)
        public
        returns (bytes memory)
    {
        (bool success, bytes memory returnData) = address(vault).call(
            funcSignature
        );
        require(success, "DecodeHelper:call to vault failed");
        return returnData;
    }

    function encodeBridgeToRouterBackData(
        uint16 vaultLZId,
        address nativeStableToken,
        address destinationStableToken,
        address sgBridge,
        address targetRouter,
        uint256 stableAmount
    ) public pure returns (bytes memory) {
        return
            abi.encode(
                vaultLZId,
                nativeStableToken,
                destinationStableToken,
                sgBridge,
                targetRouter,
                stableAmount
            );
    }

    function generatePayloadForLZ(
        string memory func,
        address vault1,
        address token,
        uint256 amount
    ) public pure returns (bytes memory) {
        bytes memory _actionData = abi.encode(token, amount);
        bytes memory funcSignature1 = abi.encodeWithSignature(
            func,
            _actionData
        );
        return abi.encode(vault1, funcSignature1);
    }

    function _sendLZ(
        uint16,
        address,
        uint64,
        bytes memory _payload
    ) public returns (bytes memory) {
        (address vault, bytes memory funcSignature) = abi.decode(
            _payload,
            (address, bytes)
        );
        (bool success, bytes memory returnData) = address(vault).call(
            funcSignature
        );
        require(success, "DecodeHelper:call to vault failed");
        return returnData;
    }

    function encodeSwapperParams(
        address tokenA,
        address tokenB,
        uint256 amount,
        address recipient
    ) public pure returns (bytes memory) {
        return abi.encode(tokenA, tokenB, amount, recipient);
    }

    function getDataForBBDirectInit(
        uint256 id,
        address impl,
        bytes memory actionPool
    ) external pure returns (bytes memory payload) {
        bytes memory funcData = abi.encode(id, impl, actionPool);
        payload = abi.encode(uint16(10), funcData);
    }

    function getDataForBBDirectUpgrade(
        uint256 id,
        address proxyAddress,
        address impl
    ) external pure returns (bytes memory payload) {
        bytes memory funcData = abi.encode(id, proxyAddress, impl);
        payload = abi.encode(uint16(11), funcData);
    }
}
