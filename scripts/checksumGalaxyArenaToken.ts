import { ethers, artifacts, network } from 'hardhat';
import Web3 from 'web3';

const rpc = "";
const web3 = new Web3(new Web3.providers.HttpProvider(rpc));

//plug this after the running the deploy script
const proxyAdminAddress = "";
const tokenProxyAddress = "";
const tokenImplementationAddress = ""; 
const multiSig = ""; //the gnosis multisig owner

const proxyAdminAbi = [{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract TransparentUpgradeableProxy","name":"proxy","type":"address"}],"name":"getProxyAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

async function main() {
    const admin = await ethers.getContractAt(proxyAdminAbi, proxyAdminAddress);
    console.log("Is proxy admin owner multisig?", await admin.owner() === multiSig);    
    console.log("Is proxy admin the admin of GalaxyArena token proxy?", await admin.getProxyAdmin(tokenProxyAddress) === admin.address);

    // Checksum bytecode
    const localByteCode = (await artifacts.readArtifact("GalaxyArenaToken")).deployedBytecode;
    const remoteBytecode = await web3.eth.getCode(tokenImplementationAddress);
    console.log("Is bytecode matching?", localByteCode === remoteBytecode);

    const galaxyArenaToken = await ethers.getContractAt("GalaxyArenaToken", tokenProxyAddress);
    console.log("Is GalaxyArena token admin multisig?", await galaxyArenaToken.owner() === multiSig);
    console.log("Token attributes:");
    console.log("Name:", await galaxyArenaToken.name());
    console.log("Symbol:", await galaxyArenaToken.symbol());
    console.log("Decimals:", await galaxyArenaToken.decimals());
    console.log("Supply:", await galaxyArenaToken.totalSupply());
    console.log("Precision:", await galaxyArenaToken.precision());
    console.log("Default Fee:", await galaxyArenaToken.defaultFee());
    console.log("FeeCollector:", await galaxyArenaToken.feeCollector());
    console.log("MultiSig balance:", await galaxyArenaToken.balanceOf(multiSig));
    // Check override fee value for an address
    // console.log(`Fee override value for <address>: ${await galaxyArenaToken.feeOverride(<address>)}`);
    // Check if an address is blocked
    // console.log(`Is <address> blocked? ${await galaxyArenaToken.isBlocked(<address>)}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
