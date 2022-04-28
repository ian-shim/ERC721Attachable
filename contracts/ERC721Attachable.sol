//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IERC721Attachable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

abstract contract ERC721Attachable is ERC721, IERC721Attachable {
  using Strings for uint256;

  struct Host {
    address contractAddress;
    uint256 tokenId;
  }
  
  mapping(uint256 => Host) private _hosts;

  function getHostContract(uint256 tokenId) public view virtual override returns (address) {
    return _hosts[tokenId].contractAddress;
  }

  function getHostTokenId(uint256 tokenId) public view virtual override returns (uint256) {
    return _hosts[tokenId].tokenId;
  }

  function attachHost(
    uint256 tokenId,
    address hostContract,
    uint256 hostTokenId
  ) public virtual override {
    require(ownerOf(tokenId) == _msgSender(), "caller is not owner");

    require(
      getHostContract(tokenId) == address(0), 
      "Host already attached. Please detach host first."
    );

    ERC721._burn(tokenId);
    _hosts[tokenId] = Host(hostContract, hostTokenId);
  }

  function detachHost(
    uint256 tokenId
  ) public virtual override {
    require(ownerOf(tokenId) == _msgSender(), "caller is not owner");
    require(
      getHostContract(tokenId) != address(0), 
      "Not attached to any host"
    );
    
    address owner = ownerOf(tokenId);
    delete _hosts[tokenId];
    _safeMint(owner, tokenId);
  }

  function ownerOf(uint256 tokenId) public view virtual override(ERC721, IERC721) returns (address) {
    Host storage host = _hosts[tokenId];
    if (host.contractAddress != address(0)) {
      ERC721 hostContract = ERC721(host.contractAddress);
      return hostContract.ownerOf(host.tokenId);
    }
    
    return super.ownerOf(tokenId);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(existsOrAttached(tokenId), "URI query for nonexistent token");

    string memory baseURI = _baseURI();
    return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
  }

  function approve(address to, uint256 tokenId) public virtual override(ERC721, IERC721) {
    require(
      getHostContract(tokenId) == address(0), 
      "Please detach host first"
    );

    super.approve(to, tokenId);
  }

  function getApproved(uint256 tokenId) public view virtual override(ERC721, IERC721) returns (address) {
    require(
      getHostContract(tokenId) == address(0), 
      "Please detach host first"
    );

    return super.getApproved(tokenId);
  }

  function transferFrom(
    address from, 
    address to, 
    uint256 tokenId
  ) public virtual override(ERC721, IERC721) {
    require(
      getHostContract(tokenId) == address(0), 
      "Cannot transfer while host is attached. Please detach host first"
    );

    super.transferFrom(from, to, tokenId);
  }

  function safeTransferFrom(
    address from, 
    address to, 
    uint256 tokenId,
    bytes memory _data
  ) public virtual override(ERC721, IERC721) {
    require(
      getHostContract(tokenId) == address(0), 
      "Cannot transfer while host is attached. Please detach host first."
    );

    super.safeTransferFrom(from, to, tokenId, _data);
  }

  function existsOrAttached(uint256 tokenId) internal view virtual returns (bool) {
    return _exists(tokenId) || getHostContract(tokenId) != address(0);
  }

  function _mint(address to, uint256 tokenId) internal virtual override {
    require(getHostContract(tokenId) == address(0), "Token already exists");
    super._mint(to, tokenId);
  }

  function _burn(uint256 tokenId) internal virtual override {
    if (getHostContract(tokenId) == address(0)) {
      super._burn(tokenId);
    } else {
      delete _hosts[tokenId];
    }
  }
}
