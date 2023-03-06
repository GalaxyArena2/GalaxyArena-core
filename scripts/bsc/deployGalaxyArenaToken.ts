import { ethers, upgrades } from 'hardhat';

const tokenName = 'Essence Token';
const tokenSymbol = 'ESNC';
const totalSupply = ethers.utils.parseEther('1000000000'); //in wei (we default to 18 decimals)
const feeCollector = '0x000000000000000000000000000000000000dead'; //address for fee collector
const defaultFee = 300; // in the precision stated below, e.g. for 10000 precision, a 4% tax would be 400
const precision = 10000; // e.g. 10000
const multiSig = '0xcffA5805976762CE3a770879277981d9edec992F'; // the address of gnosis multi-sig to act as owner of proxy admin and token, and to receive the total supply.

async function main() {
  const galaxyArenaTokenFactory = await ethers.getContractFactory('GalaxyArenaToken');
  const galaxyArenaToken = await upgrades.deployProxy(galaxyArenaTokenFactory, [
    tokenName,
    tokenSymbol,
    totalSupply,
    defaultFee,
    precision,
    feeCollector,
  ]);
  await galaxyArenaToken.deployed();
  console.log('GalaxyArena token proxy deployed to:', galaxyArenaToken.address);

  const admin = await upgrades.admin.getInstance();
  console.log('Proxy admin: ', admin.address);

  const galaxyArenaTokenImplementation = await admin.getProxyImplementation(galaxyArenaToken.address);
  console.log('GalaxyArena token implementation: ', galaxyArenaTokenImplementation);

  await admin.transferOwnership(multiSig);
  console.log('ProxyAdmin ownership successfully transfered to multisig.');

  await galaxyArenaToken.transferOwnership(multiSig);
  console.log('Token ownership successfully transfered to multisig.');

  await galaxyArenaToken.transfer(multiSig, totalSupply);
  console.log('Total supply transfered to multisig.');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
