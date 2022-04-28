import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import { expect } from 'chai';

export function shouldBehaveLikeERC721() {
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  // beforeEach(async function() {
  //   const nftContract = await ethers.getContractFactory('ERC721AttachableMock');
  //   contract = await nftContract.deploy();
  //   await contract.deployed();
  // });

  it('correctly checks all the supported interfaces', async function () {
    expect(await this.contract.supportsInterface('0x80ac58cd')).to.equal(true);
    expect(await this.contract.supportsInterface('0x01ffc9a7')).to.equal(true);
    expect(await this.contract.supportsInterface('0x5b5e139f')).to.equal(true);
  });

  it('correctly mints an NFT', async function () {
    expect(await this.contract.connect(this.alice).mint(this.alice.address, 1)).to.emit(this.contract, 'Transfer');
    expect(await this.contract.balanceOf(this.alice.address)).to.equal(1);
  });

  it('correctly mints an NFT to other', async function () {
    expect(await this.contract.connect(this.alice).mint(this.charlie.address, 1)).to.emit(this.contract, 'Transfer');
    expect(await this.contract.balanceOf(this.charlie.address)).to.equal(1);
  });

  it('returns correct balanceOf', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(1);
    await this.contract.connect(this.bob).mint(this.bob.address, this.id2);
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(2);
  });

  it('throws when trying to get count of NFTs owned by 0x0 address', async function () {
    await expect(this.contract.balanceOf(zeroAddress)).to.be.revertedWith('ERC721: balance query for the zero address');
  });

  it('throws when trying to mint 2 NFTs with the same ids', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await expect(this.contract.connect(this.bob).mint(this.bob.address, this.id1)).to.be.revertedWith('ERC721: token already minted');
  });

  it('throws when trying to mint NFT to 0x0 address', async function () {
    await expect(this.contract.connect(this.alice).mint(zeroAddress, this.id1)).to.be.revertedWith('ERC721: mint to the zero address');
  });

  it('finds the correct owner of contract id', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.ownerOf(this.id1)).to.equal(this.bob.address);
  });

  it('throws when trying to find owner od non-existing NFT id', async function () {
    await expect(this.contract.ownerOf(this.id1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
  });

  it('correctly approves account', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.connect(this.bob).approve(this.charlie.address, this.id1)).to.emit(this.contract, 'Approval');
    expect(await this.contract.getApproved(this.id1)).to.equal(this.charlie.address);
  });

  it('correctly cancels approval', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await this.contract.connect(this.bob).approve(this.charlie.address, this.id1);
    await this.contract.connect(this.bob).approve(zeroAddress, this.id1);
    expect(await this.contract.getApproved(this.id1)).to.equal(zeroAddress);
  });

  it('throws when trying to get approval of non-existing NFT id', async function () {
    await expect(this.contract.getApproved(this.id1)).to.be.revertedWith('ERC721: approved query for nonexistent token');
  });

  it('throws when trying to approve NFT ID from a third party', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await expect(this.contract.connect(this.charlie).approve(this.charlie.address, this.id1)).to.be.revertedWith('ERC721: approve caller is not owner nor approved for all');
  });

  it('correctly sets an operator', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.connect(this.bob).setApprovalForAll(this.charlie.address, true)).to.emit(this.contract, 'ApprovalForAll');
    expect(await this.contract.isApprovedForAll(this.bob.address, this.charlie.address)).to.equal(true);
  });

  it('correctly sets then cancels an operator', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await this.contract.connect(this.bob).setApprovalForAll(this.charlie.address, true);
    await this.contract.connect(this.bob).setApprovalForAll(this.charlie.address, false);
    expect(await this.contract.isApprovedForAll(this.bob.address, this.charlie.address)).to.equal(false);
  });

  it('correctly transfers NFT from owner', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.connect(this.bob).transferFrom(this.bob.address, this.charlie.address, this.id1)).to.emit(this.contract, 'Transfer');
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
    expect(await this.contract.balanceOf(this.charlie.address)).to.equal(1);
    expect(await this.contract.ownerOf(this.id1)).to.equal(this.charlie.address);
  });

  it('correctly transfers NFT from approved address', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await this.contract.connect(this.bob).approve(this.charlie.address, this.id1);
    await this.contract.connect(this.charlie).transferFrom(this.bob.address, this.alice.address, this.id1);
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
    expect(await this.contract.balanceOf(this.alice.address)).to.equal(1);
    expect(await this.contract.ownerOf(this.id1)).to.equal(this.alice.address);
  });

  it('correctly transfers NFT as operator', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await this.contract.connect(this.bob).setApprovalForAll(this.charlie.address, true);
    await this.contract.connect(this.charlie).transferFrom(this.bob.address, this.alice.address, this.id1);
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
    expect(await this.contract.balanceOf(this.alice.address)).to.equal(1);
    expect(await this.contract.ownerOf(this.id1)).to.equal(this.alice.address);
  });

  it('throws when trying to transfer NFT as an address that is not owner, approved or operator', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await expect(this.contract.connect(this.charlie).transferFrom(this.bob.address, this.alice.address, this.id1)).to.be.revertedWith('ERC721: transfer caller is not owner nor approved');
  });

  it('throws when trying to transfer NFT to a zero address', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await expect(this.contract.connect(this.bob).transferFrom(this.bob.address, zeroAddress, this.id1)).to.be.revertedWith('ERC721: transfer to the zero address');
  });

  it('throws when trying to transfer an invalid NFT', async function () {
    await expect(this.contract.connect(this.bob).transferFrom(this.bob.address, this.charlie.address, this.id1)).to.be.revertedWith('ERC721: operator query for nonexistent token');
  });

  it('correctly safe transfers NFT from owner', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.connect(this.bob)['safeTransferFrom(address,address,uint256)'](this.bob.address, this.charlie.address, this.id1)).to.emit(this.contract, 'Transfer');
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
    expect(await this.contract.balanceOf(this.charlie.address)).to.equal(1);
    expect(await this.contract.ownerOf(this.id1)).to.equal(this.charlie.address);
  });

  it('throws when trying to safe transfers NFT from owner to a smart contract', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await expect(this.contract.connect(this.bob)['safeTransferFrom(address,address,uint256)'](this.bob.address, this.contract.address, this.id1)).to.be.revertedWith('ERC721: transfer to non ERC721Receiver implementer');
  });

  it('correctly safe transfers NFT from owner to smart contract that can receive NFTs', async function () {
    const tokenReceiverContract = await ethers.getContractFactory('ERC721ReceiverMock');
    const tokenReceiver = await tokenReceiverContract.deploy();
    await tokenReceiver.deployed();

    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    await this.contract.connect(this.bob)['safeTransferFrom(address,address,uint256)'](this.bob.address, tokenReceiver.address, this.id1);
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
    expect(await this.contract.balanceOf(tokenReceiver.address)).to.equal(1);
    expect(await this.contract.ownerOf(this.id1)).to.equal(tokenReceiver.address);
  });

  it('correctly safe transfers NFT from owner to smart contract that can receive NFTs with data', async function () {
    const tokenReceiverContract = await ethers.getContractFactory('ERC721ReceiverMock');
    const tokenReceiver = await tokenReceiverContract.deploy();
    await tokenReceiver.deployed();

    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.connect(this.bob)['safeTransferFrom(address,address,uint256,bytes)'](this.bob.address, tokenReceiver.address, this.id1, '0x01')).to.emit(this.contract, 'Transfer');
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
    expect(await this.contract.balanceOf(tokenReceiver.address)).to.equal(1);
    expect(await this.contract.ownerOf(this.id1)).to.equal(tokenReceiver.address);
  });

  it('correctly burns a NFT', async function () {
    await this.contract.connect(this.bob).mint(this.bob.address, this.id1);
    expect(await this.contract.connect(this.bob).burn(this.id1)).to.emit(this.contract, 'Transfer');
    expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
    await expect(this.contract.ownerOf(this.id1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
  });

  it('throws when trying to burn non existent NFT', async function () {
    await expect(this.contract.connect(this.alice).burn(this.id1)).to.be.revertedWith('ERC721: owner query for nonexistent token');
  });
}