require('dotenv').config();
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { EssenceToken } from '../../typechain';
import { MultiSender } from '../../typechain/MultiSender';
const fs = require('fs');

// 1. 50% TGE, vesting 3 months
// 2. 8.33% TGE, vesting 11 months
// 3. 10% TGE, 10 months
// 4. 0% TGE + 3 months, vesting 12 months

// TGE timestamp: 1666353600

// 1. 1666353600, 5000, 7776000, 0xAaD64F01f3e93ff7c5877B80d21F0F34120E8F2f
// 2. 1666353600, 833, 28510000, 0xC7b1DB7C08da2811655C0aD0b8D60d2fBa6F3141
// 3. 1666353600, 1000, 25920000, 0x6039617a2b6B769fC7c17654203A0e030434B3dF
// 4. 1674304200, 0, 31536000, 0xD9B8fA17e6d7743f6ED0235eD2abF334184A3c2F

const fileName = 'Airdrop.csv';

async function main(): Promise<void> {
  const signer: SignerWithAddress = (await ethers.getSigners())[0];
  const { addresses, amounts } = getAddresses();
  console.log('Airdropping with', signer.address, 'to', addresses.length, 'addresses');
  const contract = (await ethers.getContractAt(
    'MultiSender',
    '0x9BC4998120c861BA10aBa980c897F13B6905bB09',
    signer
  )) as MultiSender;

  // const token = (await ethers.getContractAt(
  //   'EssenceToken',
  //   '0x04d80CdF20285d5Ac590BBAd97C887b9C6781774',
  //   signer
  // )) as EssenceToken;

  // console.log(await token.allowance(signer.address, contract.address));

  const tx = await contract.airdropERC20(addresses, amounts, { nonce: 25 });
  console.log('Airdrop tx:', tx.hash);
  await tx.wait();
}

function getAddresses(): { addresses: string[]; amounts: BigNumber[] } {
  const data: string = fs.readFileSync(fileName, 'utf8');
  const lines = data.split('\r\n');
  const addressesAndAmounts = lines.map((x) => x.split(','));
  const addresses: string[] = [];
  const amounts: BigNumber[] = [];
  for (const line of addressesAndAmounts) {
    if (!ethers.utils.isAddress(line[0])) throw new Error(line[0]);
    addresses.push(line[0]);
    amounts.push(ethers.utils.parseEther(line[1]));
  }
  return { addresses, amounts };
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
