// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ERC20Mock is IERC20Metadata, ERC20 {
    constructor(string memory desc, string memory name) ERC20(desc, name) {}

    function mint(address _to, uint256 _amount) external returns (bool) {
        _mint(_to, _amount);
        return true;
    }

    function mintArbitrary(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
