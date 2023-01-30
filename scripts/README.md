# GalaxyArena Scripts

## How to deploy GalaxyArenaToken.sol
1. Make sure parameters inside script are adapted to your needs
2. Run the following command in root directory of your repo: `npx hardhat run --network <network> scripts/deployGalaxyArenaToken.ts`
3. Script log all of the relevant information.

`deployGalaxyArenaToken.ts` deploys GalaxyArenaToken using TransparentUpgradeableProxy mechanism, which means it also deploys ProxyAdmin, GalaxyArenaToken proxy and GalaxyArenaToken implementation.
Script makes sure that all ownerships are transferred to the MultiSig contract of your choosing, along with all the minted tokens.

## How to checksum GalaxyArenaToken.sol after deployment
1. Make sure parameters inside script are adapted to your needs
2. Run the following command in root directory of your repo: `npx hardhat run --network <network> scripts/checksumGalaxyArenaToken.ts`
3. Current state of important GalaxyArenaToken information will be represented through output.

`checksumGalaxyArenaToken.ts` will get information from blockchain about the GalaxyArenaToken attributes.
Ownerships will be checked for both ProxyAdmin and Token Proxy.

## How to generate calldata in order to call overrideFees() by MultiSig
1. Make sure parameters inside script are adapted to your needs (addresses for which fees should be overriden and the fee values for them the same order)
2. Run the following command in root directory of your repo: `npx hardhat run --network <network> scripts/generateFeeOverrideCalldata.ts`
3. The calldata will be received as output.
