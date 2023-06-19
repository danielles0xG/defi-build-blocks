// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract BridgeMock {
    uint256 public lastBridge;

    constructor() {}

    function bridge(
        address _token,
        uint256 _amount,
        uint16 _destChainId,
        address _destinationAddress,
        address _destinationToken,
        bytes calldata receiverPayload
    ) external {
        uint256 usdcBalance = IERC20(_token).balanceOf(address(this));
        require(
            IERC20(_token).transfer(_destinationAddress, usdcBalance),
            "BridgeMock funds transfer failed"
        );
        lastBridge = _amount;
    }

    function swap(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        address _recipient
    ) external pure returns (bool a, uint256 v) {
        a = true;
        v = _amountA;
    }

    function getChainID() internal view returns (uint16) {
        uint16 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}
