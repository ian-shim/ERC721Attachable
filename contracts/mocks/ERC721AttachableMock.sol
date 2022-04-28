//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../ERC721Attachable.sol";

contract ERC721AttachableMock is ERC721Attachable {
  constructor() payable ERC721("MockAttachable", "MA") {}

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