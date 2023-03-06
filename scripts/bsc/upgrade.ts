require('dotenv').config();
import { ethers, upgrades } from 'hardhat';

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contract with account:', deployer.address);
  const factory = await ethers.getContractFactory('GalaxyArenaToken');
  const implementationAddress = await upgrades.prepareUpgrade('0xBBf1889f22d37640Bc70c58B2F643106db0542DE', factory);
  console.log('Contract address:', implementationAddress);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
