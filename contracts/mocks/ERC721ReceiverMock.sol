//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ERC721ReceiverMock is IERC721Receiver {
  event Received(address operator, address from, uint256 tokenId, bytes data, uint256 gas);

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes memory data
  ) public override returns (bytes4) {
    emit Received(operator, from, tokenId, data, gasleft());
    return 0x150b7a02;
  }
}