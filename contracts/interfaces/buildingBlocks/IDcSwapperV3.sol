// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

interface IDcSwapperV3 {
    function setDex(bytes memory _data) external;

    function setQuoter(bytes memory _data) external;

    function setFeesLevels(bytes memory _data) external;

    function swap(bytes memory _data) external payable returns (uint256);

    function isTokensSupported(address _bridgeToken, address[] memory _tokens)
        external
        view
        returns (bool[] memory);

    function isPairsSupported(address[][] calldata _tokens)
        external
        view
        returns (bool[] memory);

    function quote(bytes memory _data) external returns (uint256);
}
