// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

struct VestingPeriod {
    uint256 cliff;
    uint256 cliffAmount; // in myriad
    uint256 duration;
}

struct VestedBalance {
    uint256 vestingId;
    uint256 amount; // in wei
}

abstract contract VestedToken is AccessControl, ERC20 {
    uint256 vestingCounter;
    mapping(uint256 => VestingPeriod) public vestingPeriods;
    mapping(address => uint256) public vestingAdmins;
    mapping(address => VestedBalance) public vestedBalances;

    event VestingScheduleAdded(uint256 indexed vestingId, uint256 cliff, uint256 cliffAmount, uint256 duration);
    event VestedTokens(uint256 indexed vestingId, address indexed account, uint256 amount);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setupVestingSchedule(
        uint256 cliff,
        uint256 cliffAmount,
        uint256 duration,
        address vestingAdmin
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(cliffAmount <= 10000, "MAX_CLIFF");
        uint256 vestingId = ++vestingCounter;
        vestingPeriods[vestingId] = VestingPeriod(cliff, cliffAmount, duration);
        require(vestingAdmins[vestingAdmin] == 0, "VESTING_ADMIN_ALREADY_SET");
        vestingAdmins[vestingAdmin] = vestingId;
        emit VestingScheduleAdded(vestingId, cliff, cliffAmount, duration);
    }

    function lockedTokens(address account) public view returns (uint256) {
        VestedBalance storage vestingBalance = vestedBalances[account];
        uint256 id = vestingBalance.vestingId;
        uint256 amount = vestingBalance.amount;
        if (id == 0) return 0;

        VestingPeriod storage vestingPeriod = vestingPeriods[id];
        uint256 cliff = vestingPeriod.cliff;
        uint256 duration = vestingPeriod.duration;
        if (cliff > block.timestamp) {
            return amount;
        } else if (block.timestamp >= cliff + duration) {
            return 0;
        }
        uint256 cliffAmount = (amount * vestingPeriod.cliffAmount) / 10000;
        uint256 vestedAmount = ((amount - cliffAmount) * (block.timestamp - cliff)) / duration;
        return cliffAmount - vestedAmount;
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        VestedBalance storage vestingBalance = vestedBalances[to];
        uint256 id = vestingAdmins[from];
        if (id != 0) {
            // if sender is vesting admin, setup vesting balance for receiving address
            require(vestingBalance.vestingId == 0, "USER_ALREADY_VESTED");
            vestingBalance.vestingId = id;
            vestingBalance.amount = amount;
            emit VestedTokens(id, to, amount);
        } else {
            require(balanceOf(from) >= lockedTokens(from), "TOKENS_VESTED");
        }
    }
}
