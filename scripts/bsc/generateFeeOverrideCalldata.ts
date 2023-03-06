import { ethers } from 'hardhat';

// Array of addresses to override fee values for
const addresses: string[] = [
  '0xcffA5805976762CE3a770879277981d9edec992F',
  '0xbB4A6c56c8CE510b7f7DcacB3045F9aba14e72A5',
  '0x71e9d293a59fe85C0c7f04175f69481e3282Db23',
  '0xE103143d99CC8Fe270A5cF2FD36e7F21871b0067',
  '0x3938D6F4b96614dbDD0867b959EA0e6Cd55174ED',
  '0x452e11CF041A86B1e26edC0892d885197c8FA100',
  '0x6403Ea9Ba8FB081B47760D1F7514fc890C4A459B',
  '0x10414533FF0C1800b2ab7E12FD1dAf2A97Afd97d',
  '0xD7885F834Ba7C314DAC198920eD10FDc72603D0B',
  '0x664936b6921E6E59a568dD0dC738CD29Ac8b5757',
];
// Array of fees to set
const fees: number[] = [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000];

async function main() {
  const methodId = ethers.utils
    .keccak256(ethers.utils.toUtf8Bytes('overrideFees(address[],uint256[])'))
    .substring(0, 10);
  const types = ['address[]', 'uint256[]']; // Types to encode
  const values = [addresses, fees]; // Values to encode

  const abi = new ethers.utils.AbiCoder(); // Get abi coder instance
  let data = methodId + abi.encode(types, values).substring(2); // Generate calldata
  console.log(`Calldata: ${data}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
