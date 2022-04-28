import { expect } from "chai";
import { ethers } from "hardhat";
import { shouldBehaveLikeERC721 } from "./shouldBehaveLikeERC721"

describe("ERC721Attachable", async function() {
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  before(async function() {
    const accounts = await ethers.getSigners();
    [this.alice, this.bob, this.charlie] = accounts.slice(1);
    [this.id1, this.id2, this.id3] = [123, 124, 125];
  });

  describe('initial state', function() {
    beforeEach(async function () {
      const nftContract = await ethers.getContractFactory('ERC721AttachableMock');
      this.contract = await nftContract.deploy();
      await this.contract.deployed();
    });

    shouldBehaveLikeERC721();
  });

  describe('with attached token', async function() {
    beforeEach(async function() {
      const [attachableContract, nftContract] = await Promise.all([
        ethers.getContractFactory('ERC721AttachableMock'),
        ethers.getContractFactory('ERC721Mock')
      ]);
      [this.contract, this.hostContract] = await Promise.all([
        attachableContract.deploy(),
        nftContract.deploy(),
      ]);
      await Promise.all([this.contract.deployed(), this.hostContract.deployed()]);

      await this.contract.connect(this.alice).mint(this.alice.address, this.id1);
      await this.hostContract.connect(this.bob).mint(this.bob.address, this.id2);
    });

    it('cannot attach if not the owner', async function() {
      await expect(this.contract.connect(this.bob).attachHost(
        this.id1,
        this.hostContract.address,
        this.id2
      )).be.revertedWith("caller is not owner")
    });


    it('attaches to a host', async function() {
      expect(await this.contract.getHostContract(this.id1)).to.eq(zeroAddress);
      expect(await this.contract.getHostTokenId(this.id1)).to.eq(0);
      expect(await this.contract.balanceOf(this.alice.address)).to.eq(1);

      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      
      expect(await this.contract.balanceOf(this.alice.address)).to.eq(0);
      expect(await this.contract.ownerOf(this.id1)).to.eq(this.bob.address);
      expect(await this.contract.getHostContract(this.id1)).to.eq(this.hostContract.address);
      expect(await this.contract.getHostTokenId(this.id1)).to.eq(this.id2);
    });

    it('cannot be minted again', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await expect(this.contract.connect(this.alice).mint(this.alice.address, this.id1))
        .to.be.revertedWith("Token already exists");
      await expect(this.contract.connect(this.bob).mint(this.alice.address, this.id1))
        .to.be.revertedWith("Token already exists");
    });

    it('detaches from a host', async function() {
      expect(await this.contract.balanceOf(this.bob.address)).to.eq(0);

      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await this.contract.connect(this.bob).detachHost(this.id1);

      expect(await this.contract.balanceOf(this.bob.address)).to.eq(1);
      expect(await this.contract.ownerOf(this.id1)).to.eq(this.bob.address);
      expect(await this.contract.getHostContract(this.id1)).to.eq(zeroAddress);
      expect(await this.contract.getHostTokenId(this.id1)).to.eq(0);
    });

    it('cannot detach if not the host owner', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await expect(this.contract.connect(this.alice).detachHost(this.id1))
        .to.be.revertedWith("caller is not owner");
    });

    it('cannot approve when attached', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await expect(this.contract.connect(this.bob).approve(
        this.alice.address,
        this.id1
      )).to.be.revertedWith("Please detach host first");
    });

    it('cannot get approved list when attached', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await expect(this.contract.connect(this.bob).getApproved(
        this.id1
      )).to.be.revertedWith("Please detach host first");
    });

    it('cannot be transferred when attached', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await expect(this.contract.connect(this.bob).transferFrom(
        this.bob.address,
        this.alice.address,
        this.id1
      )).to.be.revertedWith("Cannot transfer while host is attached. Please detach host first");
    });

    it('cannot be safeTransferred when attached', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await expect(this.contract.connect(this.bob)['safeTransferFrom(address,address,uint256)'](
        this.bob.address,
        this.alice.address,
        this.id1
      )).to.be.revertedWith("Cannot transfer while host is attached. Please detach host first");
    });

    it('cannot be safeTransferred with data when attached', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await expect(this.contract.connect(this.bob)['safeTransferFrom(address,address,uint256,bytes)'](
        this.bob.address,
        this.alice.address,
        this.id1,
        '0x01'
      )).to.be.revertedWith("Cannot transfer while host is attached. Please detach host first");
    });

    it('moves with the host token', async function() {
      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await this.hostContract.connect(this.bob)['safeTransferFrom(address,address,uint256)'](
        this.bob.address,
        this.charlie.address,
        this.id2
      );
      expect(await this.contract.getHostContract(this.id1)).to.eq(this.hostContract.address);
      expect(await this.contract.getHostTokenId(this.id1)).to.eq(this.id2);
      expect(await this.contract.ownerOf(this.id1)).to.eq(this.charlie.address);
    });
  });

  describe('with detached token', async function() {
    beforeEach(async function() {
      const [attachableContract, nftContract] = await Promise.all([
        ethers.getContractFactory('ERC721AttachableMock'),
        ethers.getContractFactory('ERC721Mock')
      ]);
      [this.contract, this.hostContract] = await Promise.all([
        attachableContract.deploy(),
        nftContract.deploy(),
      ]);
      await Promise.all([this.contract.deployed(), this.hostContract.deployed()]);

      await this.contract.connect(this.alice).mint(this.alice.address, this.id1);
      await this.hostContract.connect(this.bob).mint(this.bob.address, this.id2);

      await this.contract.connect(this.alice).attachHost(this.id1, this.hostContract.address, this.id2);
      await this.contract.connect(this.bob).detachHost(this.id1);
    });

    it('should not be attached to any host', async function() {
      expect(await this.contract.getHostContract(this.id1)).to.eq(zeroAddress);
      expect(await this.contract.getHostTokenId(this.id1)).to.eq(0);
      expect(await this.contract.balanceOf(this.alice.address)).to.eq(0);
      expect(await this.contract.balanceOf(this.bob.address)).to.eq(1);
    });

    it('should find the correct owner', async function() {
      expect(await this.contract.ownerOf(this.id1)).to.eq(this.bob.address);
    });

    it('cannot be minted again', async function() {
      await expect(this.contract.connect(this.alice).mint(this.alice.address, this.id1))
        .to.be.revertedWith("ERC721: token already minted");
      await expect(this.contract.connect(this.bob).mint(this.alice.address, this.id1))
        .to.be.revertedWith("ERC721: token already minted");
    });

    it('can attach to a host', async function() {
      await this.hostContract.connect(this.charlie).mint(this.charlie.address, this.id3);

      await this.contract.connect(this.bob).attachHost(this.id1, this.hostContract.address, this.id3);

      expect(await this.contract.balanceOf(this.bob.address)).to.eq(0);
      expect(await this.contract.balanceOf(this.charlie.address)).to.eq(0);
      expect(await this.contract.ownerOf(this.id1)).to.eq(this.charlie.address);
      expect(await this.contract.getHostContract(this.id1)).to.eq(this.hostContract.address);
      expect(await this.contract.getHostTokenId(this.id1)).to.eq(this.id3);
    });

    it('cannot be attached if not owner', async function() {
      await expect(this.contract.connect(this.alice).attachHost(
        this.id1,
        this.hostContract.address,
        this.id2
      )).to.be.revertedWith('caller is not owner');
    });

    it('cannot be detached again', async function() {
      await expect(this.contract.connect(this.bob).detachHost(this.id1)).to.be.revertedWith('Not attached to any host')
    });

    it('can get approvals', async function () {
      expect(await this.contract.connect(this.bob).approve(this.charlie.address, this.id1)).to.emit(this.contract, 'Approval');
      expect(await this.contract.getApproved(this.id1)).to.equal(this.charlie.address);
    });

    it('can cancel approvals', async function () {
      await this.contract.connect(this.bob).approve(this.charlie.address, this.id1);
      await this.contract.connect(this.bob).approve(zeroAddress, this.id1);
      expect(await this.contract.getApproved(this.id1)).to.equal(zeroAddress);
    });

    it('can set an operator', async function () {
      expect(await this.contract.connect(this.bob).setApprovalForAll(this.charlie.address, true)).to.emit(this.contract, 'ApprovalForAll');
      expect(await this.contract.isApprovedForAll(this.bob.address, this.charlie.address)).to.equal(true);
    });

    it('can transfer NFT from owner', async function () {
      expect(await this.contract.connect(this.bob).transferFrom(this.bob.address, this.charlie.address, this.id1)).to.emit(this.contract, 'Transfer');
      expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
      expect(await this.contract.balanceOf(this.charlie.address)).to.equal(1);
      expect(await this.contract.ownerOf(this.id1)).to.equal(this.charlie.address);
    });

    it('can transfer NFT from approved address', async function () {
      await this.contract.connect(this.bob).approve(this.charlie.address, this.id1);
      await this.contract.connect(this.charlie).transferFrom(this.bob.address, this.alice.address, this.id1);
      expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
      expect(await this.contract.balanceOf(this.alice.address)).to.equal(1);
      expect(await this.contract.ownerOf(this.id1)).to.equal(this.alice.address);
    });

    it('can transfer NFT as operator', async function () {
      await this.contract.connect(this.bob).setApprovalForAll(this.charlie.address, true);
      await this.contract.connect(this.charlie).transferFrom(this.bob.address, this.alice.address, this.id1);
      expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
      expect(await this.contract.balanceOf(this.alice.address)).to.equal(1);
      expect(await this.contract.ownerOf(this.id1)).to.equal(this.alice.address);
    });

    it('can safe transfer NFT from owner', async function () {
      expect(await this.contract.connect(this.bob)['safeTransferFrom(address,address,uint256)'](this.bob.address, this.charlie.address, this.id1)).to.emit(this.contract, 'Transfer');
      expect(await this.contract.balanceOf(this.bob.address)).to.equal(0);
      expect(await this.contract.balanceOf(this.charlie.address)).to.equal(1);
      expect(await this.contract.ownerOf(this.id1)).to.equal(this.charlie.address);
    });
  });
});
