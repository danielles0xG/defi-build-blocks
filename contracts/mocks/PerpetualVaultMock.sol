// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;
import "./ERC20Mock.sol";
import "hardhat/console.sol";

contract PerpetualVaultMock {
    mapping(address => uint256) public deposits;
    address public _wToken;

    constructor(address wToken_) {
        _wToken = wToken_;
    }

    function deposit(address token, uint256 amount) external {
        ERC20Mock(token).transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }

    function getFreeCollateral(address trader)
        external
        view
        returns (uint256 freeCollateral)
    {
        return 1 ether;
    }

    function withdraw(address token, uint256 amount) external {
        if (ERC20Mock(token).balanceOf(address(this)) > 0) {
            ERC20Mock(token).transfer(msg.sender, amount);
        } else {
            ERC20Mock(token).mint(msg.sender, amount);
        }
    }
}
