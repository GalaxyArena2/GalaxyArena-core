require('dotenv').config();
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { GalaxyArena } from '../typechain';

describe('GalaxyArena', () => {
  let ga: GalaxyArena;
  let accounts: SignerWithAddress[];
  let owner: string;

  before(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0].address;
    const factory = await ethers.getContractFactory('GalaxyArena');
    ga = await factory.deploy();
  });

  describe('Setup tests', async () => {
    it('should set up token correctly', async () => {
      expect(await ga.name()).to.equal('Essence Token');
      expect(await ga.symbol()).to.equal('ESNC');
      expect(await ga.totalSupply()).to.equal(ethers.utils.parseEther('1000000000'));
    });

    it('should setup permissions correctly', async () => {
      expect(await ga.hasRole(ethers.constants.HashZero, owner)).to.be.true;
    });
  });
});
