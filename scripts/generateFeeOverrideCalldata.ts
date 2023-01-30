import { ethers } from 'hardhat';

// Array of addresses to override fee values for
const addresses: string[] = ['', '', ''];
// Array of fees to set
const fees: number[] = [0, 0, 0];

async function main() {
    const methodId = (ethers.utils.keccak256(ethers.utils.toUtf8Bytes("overrideFees(address[],uint256[])"))).substring(0,10);
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
    .catch(error => {
        console.error(error);
        process.exit(1);
    });