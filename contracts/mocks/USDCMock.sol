// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCMock is ERC20 {
    /* solhint-disable */
    constructor() ERC20("USDC", "USDC") {}

    function mint(address _to, uint256 _amount) external returns (bool) {
        _mint(_to, _amount);
        return true;
    }

    function burn(uint256 _amount) external returns (bool) {
        _burn(msg.sender, _amount);
        return true;
    }

    function decimals() public view override returns (uint8) {
        return 6;
    }
    /* solhint-enable */
}
