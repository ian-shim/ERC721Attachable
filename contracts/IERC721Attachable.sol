//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IERC721Attachable is IERC721 {
  function getHostContract(uint256 tokenId) external view returns (address);
  function getHostTokenId(uint256 tokenId) external view returns (uint256);

  function attachHost(
    uint256 tokenId,
    address hostContract,
    uint256 hostTokenId
  ) external;
  function detachHost(
    uint256 tokenId
  ) external;
}
