require('dotenv').config();
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { GalaxyArenaToken } from '../typechain';

const tokenName = 'Test Token'
const tokenSymbol = 'TT';
const defaultFee = 100;
const precision = 10000;
const totalSupply = ethers.utils.parseEther('1000000');
let feeCollector: string;

describe('GalaxyArenaToken', () => {
  let token: GalaxyArenaToken;
  let accounts: SignerWithAddress[];
  let owner: string;

  before(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0].address;
    feeCollector = accounts[1].address;
    const factory = await ethers.getContractFactory('GalaxyArenaToken');
    token = (await upgrades.deployProxy(factory, [tokenName, tokenSymbol, totalSupply, defaultFee, precision, feeCollector])) as GalaxyArenaToken;
  });

  describe('Setup tests', async () => {
    it('should set up token correctly', async () => {
      expect(await token.name()).to.equal(tokenName);
      expect(await token.symbol()).to.equal(tokenSymbol);
      expect(await token.precision()).to.equal(precision);
      expect(await token.defaultFee()).to.equal(defaultFee);
      expect(await token.feeCollector()).to.equal(feeCollector);
      expect(await token.totalSupply()).to.equal(totalSupply);
      expect(await token.balanceOf(owner)).to.equal(totalSupply);
    });
  });
});
