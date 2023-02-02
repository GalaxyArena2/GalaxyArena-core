require('dotenv').config();
import { ethers, upgrades } from 'hardhat';

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contract with account:', deployer.address);
  const factory = await ethers.getContractFactory('EssenceToken');
  const contract = await upgrades.deployProxy(factory, []);
  console.log('Contract address:', contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
