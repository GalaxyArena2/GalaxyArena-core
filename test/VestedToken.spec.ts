require('dotenv').config();
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { GalaxyArena } from '../typechain';

describe('GalaxyArena', () => {
  let ga: GalaxyArena;
  let accounts: SignerWithAddress[];
  const timestamp = 2000000000;
  const week = 604800;

  before(async () => {
    accounts = await ethers.getSigners();
    const factory = await ethers.getContractFactory('GalaxyArena');
    ga = await factory.deploy();
  });

  describe('Create new vesting schedules', async () => {
    it('cliff amount cannot exceed 100%', async () => {
      await expect(ga.setupVestingSchedule(0, 10001, 0, accounts[1].address)).to.be.revertedWith('MAX_CLIFF');
    });

    it('only admin should be able to set up a vesting schedule', async () => {
      await expect(ga.connect(accounts[1]).setupVestingSchedule(timestamp + week, 5000, week, accounts[1].address)).to
        .be.reverted;
    });

    it('should be able to set up a new vesting schedule', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp]);

      await expect(ga.setupVestingSchedule(timestamp + week, 5000, week, accounts[1].address))
        .to.emit(ga, 'VestingScheduleAdded')
        .withArgs(1, timestamp + week, 5000, week);
      expect(await ga.vestingAdmins(accounts[1].address)).to.equal(1);
      const vestingPeriod = await ga.vestingPeriods(1);
      expect(vestingPeriod.cliff).to.equal(timestamp + week);
      expect(vestingPeriod.cliffAmount).to.equal(5000);
      expect(vestingPeriod.duration).to.equal(week);
    });

    it('vesting admin can only be admin for one vesting period', async () => {
      await expect(ga.setupVestingSchedule(0, 5000, 0, accounts[1].address)).to.be.revertedWith(
        'VESTING_ADMIN_ALREADY_SET'
      );
    });
  });

  describe('Register vested balances', async () => {
    it('should not vest tokens if sender is not vesting admin', async () => {
      await expect(ga.transfer(accounts[1].address, ethers.utils.parseEther('1000000'))).to.not.emit(
        ga,
        'VestedTokens'
      );
    });
    it('should vest tokens for recipient if sender is vesting admin', async () => {
      await expect(ga.connect(accounts[1]).transfer(accounts[2].address, ethers.utils.parseEther('1000')))
        .to.emit(ga, 'VestedTokens')
        .withArgs(1, accounts[2].address, ethers.utils.parseEther('1000'));
    });

    it('should lock tokens correctly', async () => {
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(ethers.utils.parseEther('1000'));
      await expect(ga.connect(accounts[2]).transfer(accounts[3].address, 1)).to.be.revertedWith('TOKENS_VESTED');
    });

    it('should return 0 locked tokens if user is not vested', async () => {
      expect(await ga.lockedTokens(accounts[0].address)).to.equal(0);
    });

    it('should unlock cliff amount after cliff timestamp', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, ethers.utils.parseEther('500').add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(ethers.utils.parseEther('500'));
    });

    it('should unlock cliff amount + 10% vesting', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week + week / 5]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, ethers.utils.parseEther('600').add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(ethers.utils.parseEther('400'));
    });

    it('should be able to transfer unlocked tokens', async () => {
      await expect(ga.connect(accounts[2]).transfer(accounts[3].address, ethers.utils.parseEther('600'))).to.emit(
        ga,
        'Transfer'
      );
    });

    it('should unlock cliff amount + 50% vesting', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week + week / 2]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, ethers.utils.parseEther('150').add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(ethers.utils.parseEther('250'));
    });

    it('should unlock 90% of tokens', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week + (week * 4) / 5]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, ethers.utils.parseEther('300').add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(ethers.utils.parseEther('100'));
    });

    it('should unlock full token amount', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week * 2]);
      await network.provider.send('evm_mine');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(0);
    });

    it('should unlock full token amount after cliff + duration', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week * 2 + 1]);
      await network.provider.send('evm_mine');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(0);
    });

    it('should be able to transfer remaining tokens', async () => {
      await expect(ga.connect(accounts[2]).transfer(accounts[3].address, ethers.utils.parseEther('400'))).to.emit(
        ga,
        'Transfer'
      );
    });
  });
});
