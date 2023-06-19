// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWETH {
    function deposit() external payable;

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool success);

    function approve(address _spender, uint256 _value)
        external
        returns (bool success);

    function withdraw(uint256 amount) external returns (uint256);

    function balanceOf(address _account)
        external
        view
        returns (uint256 _balance);
}
