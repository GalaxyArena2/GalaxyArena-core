import '@nomiclabs/hardhat-waffle';
import 'solidity-coverage';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-etherscan';
import { HardhatUserConfig, task } from 'hardhat/config';
require('dotenv').config();

const config: HardhatUserConfig =
  process.env.ENV === 'dev'
    ? {
        defaultNetwork: 'hardhat',
        networks: {
          mumbai: {
            url: 'https://polygon-mumbai.infura.io/v3/' + process.env.INFURA_TOKEN,
            accounts: [process.env.DEV_PRIVATE_KEY as string],
            gasPrice: 8000000000,
          },
          hardhat: {},
        },
        solidity: {
          compilers: [
            {
              version: '0.8.13',
              settings: {
                optimizer: {
                  enabled: true,
                  runs: 10000,
                },
              },
            },
          ],
        },
        gasReporter: {
          currency: 'USD',
          gasPrice: 50,
          enabled: process.env.REPORT_GAS === 'true',
        },
        etherscan: {
          apiKey: process.env.ETHERSCAN_TOKEN,
        },
      }
    : {
        solidity: {
          compilers: [
            {
              version: '0.8.13',
            },
          ],
        },
      };

task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

export default config;
