//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Mock is ERC721 {
  constructor() payable ERC721("MockERC721", "NFT") {}

  function mint(address to, uint256 tokenId) public {
    _mint(to, tokenId);
  }

  function safeMint(address to, uint256 tokenId) public {
    _safeMint(to, tokenId);
  }

  function safeMint(address to, uint256 tokenId, bytes memory data) public {
    _safeMint(to, tokenId, data);
  }

  function burn(uint256 tokenId) public {
    _burn(tokenId);
  }
}