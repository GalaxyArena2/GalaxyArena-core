require('dotenv').config();
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { EssenceToken } from '../../typechain';

async function main(): Promise<void> {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];

  const contract = (await ethers.getContractAt(
    'EssenceToken',
    '0x04d80CdF20285d5Ac590BBAd97C887b9C6781774',
    signer
  )) as EssenceToken;

  const tx = await contract.setupVestingSchedule(0, 0, 0, '0x3baa9B79A0e9bC3765cF878563bcC797cEe48e55');
  console.log('tx:', tx.hash);
  await tx.wait();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
