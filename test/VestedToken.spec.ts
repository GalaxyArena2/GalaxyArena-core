require('dotenv').config();
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, network, upgrades } from 'hardhat';
import { EssenceToken } from '../typechain';

describe('VestedToken', () => {
  let ga: EssenceToken;
  let accounts: SignerWithAddress[];
  let timestamp = 2000000000;
  const week = 604800;
  const amount = ethers.utils.parseEther('1000');

  before(async () => {
    accounts = await ethers.getSigners();
    const factory = await ethers.getContractFactory('EssenceToken');
    ga = (await upgrades.deployProxy(factory, [])) as EssenceToken;
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

      await expect(ga.setupVestingSchedule(timestamp + week, 4000, week, accounts[1].address))
        .to.emit(ga, 'VestingScheduleAdded')
        .withArgs(1, timestamp + week, 4000, week);
      expect(await ga.vestingAdmins(accounts[1].address)).to.equal(1);
      const vestingPeriod = await ga.vestingPeriods(1);
      expect(vestingPeriod.cliff).to.equal(timestamp + week);
      expect(vestingPeriod.cliffAmount).to.equal(4000);
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
      await expect(ga.transfer(accounts[1].address, amount)).to.not.emit(ga, 'VestedTokens');
    });
    it('should vest tokens for recipient if sender is vesting admin', async () => {
      await expect(ga.connect(accounts[1]).transfer(accounts[2].address, amount))
        .to.emit(ga, 'VestedTokens')
        .withArgs(1, accounts[2].address, amount);
    });

    it('should lock tokens correctly', async () => {
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(amount);
      await expect(ga.connect(accounts[2]).transfer(accounts[3].address, 1)).to.be.revertedWith('TOKENS_VESTED');
    });

    it('should return 0 locked tokens if user is not vested', async () => {
      expect(await ga.lockedTokens(accounts[0].address)).to.equal(0);
    });

    it('should unlock cliff amount after cliff timestamp', async () => {
      let lockedAmount = amount.mul(6).div(10);
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, amount.sub(lockedAmount).add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(lockedAmount);
    });

    it('should unlock cliff amount + 10% of tokens through vesting', async () => {
      let lockedAmount = amount.div(2);
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week + week / 6]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, amount.sub(lockedAmount).add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(lockedAmount);
    });

    it('should be able to transfer unlocked tokens', async () => {
      await expect(ga.connect(accounts[2]).transfer(accounts[3].address, amount.div(2))).to.emit(ga, 'Transfer');
    });

    it('should unlock cliff amount + 30% if tokens through vesting', async () => {
      let lockedAmount = amount.mul(3).div(10);
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week + week / 2]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, amount.mul(2).div(10).add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(lockedAmount);
    });

    it('should unlock 90% of tokens', async () => {
      let lockedAmount = amount.div(10);
      await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week + (week * 5) / 6]);
      await expect(
        ga.connect(accounts[2]).transfer(accounts[3].address, amount.mul(4).div(10).add(1))
      ).to.be.revertedWith('TOKENS_VESTED');
      expect(await ga.lockedTokens(accounts[2].address)).to.equal(lockedAmount);
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
      await expect(ga.connect(accounts[2]).transfer(accounts[3].address, amount.div(2))).to.emit(ga, 'Transfer');
    });
  });

  describe('Different vesting schedule tests', async () => {
    describe('Unlock all tokens after a specific amount of time', async () => {
      before(async () => {
        timestamp = 2100000000;
        await ga.transfer(accounts[4].address, ethers.utils.parseEther('1000000'));
        await network.provider.send('evm_setNextBlockTimestamp', [timestamp]);
      });
      it('setup vesting schedule', async () => {
        await expect(ga.setupVestingSchedule(timestamp + week, 10000, 0, accounts[4].address))
          .to.emit(ga, 'VestingScheduleAdded')
          .withArgs(2, timestamp + week, 10000, 0);
        expect(await ga.vestingAdmins(accounts[4].address)).to.equal(2);
        const vestingPeriod = await ga.vestingPeriods(2);
        expect(vestingPeriod.cliff).to.equal(timestamp + week);
        expect(vestingPeriod.cliffAmount).to.equal(10000);
        expect(vestingPeriod.duration).to.equal(0);
      });

      it('all tokens should be locked', async () => {
        await ga.connect(accounts[4]).transfer(accounts[5].address, ethers.utils.parseEther('1000000'));
        expect(await ga.lockedTokens(accounts[5].address)).to.equal(ethers.utils.parseEther('1000000'));
      });

      it('all tokens should unlock', async () => {
        await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week]);
        await network.provider.send('evm_mine');
        expect(await ga.lockedTokens(accounts[5].address)).to.equal(0);
      });
    });

    describe('Unlock tokens over time without a cliff', async () => {
      before(async () => {
        timestamp = 2200000000;
        await ga.transfer(accounts[6].address, amount);
      });

      it('setup vesting schedule', async () => {
        await expect(ga.setupVestingSchedule(timestamp, 0, week, accounts[6].address))
          .to.emit(ga, 'VestingScheduleAdded')
          .withArgs(3, timestamp, 0, week);
        expect(await ga.vestingAdmins(accounts[6].address)).to.equal(3);
        const vestingPeriod = await ga.vestingPeriods(3);
        expect(vestingPeriod.cliff).to.equal(timestamp);
        expect(vestingPeriod.cliffAmount).to.equal(0);
        expect(vestingPeriod.duration).to.equal(week);
      });

      it('all tokens should be locked', async () => {
        await network.provider.send('evm_setNextBlockTimestamp', [timestamp]);
        await ga.connect(accounts[6]).transfer(accounts[7].address, amount);
        expect(await ga.lockedTokens(accounts[7].address)).to.equal(amount);
      });

      it('50% of tokens should unlock', async () => {
        await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week / 2]);
        await network.provider.send('evm_mine');
        expect(await ga.lockedTokens(accounts[7].address)).to.equal(amount.div(2));
      });

      it('70% of tokens should unlock', async () => {
        await network.provider.send('evm_setNextBlockTimestamp', [timestamp + (week * 7) / 10]);
        await network.provider.send('evm_mine');
        expect(await ga.lockedTokens(accounts[7].address)).to.equal(amount.mul(3).div(10));
      });

      it('all tokens should unlock', async () => {
        await network.provider.send('evm_setNextBlockTimestamp', [timestamp + week]);
        await network.provider.send('evm_mine');
        expect(await ga.lockedTokens(accounts[7].address)).to.equal(0);
      });
    });
  });
});
