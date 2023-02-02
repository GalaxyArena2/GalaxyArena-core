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
          bnb: {
            url: 'https://bsc-dataseed.binance.org/',
            accounts: {
              mnemonic: process.env.MNEMONIC_BNB as string,
            },
          },
          mumbai: {
            url: 'https://polygon-mumbai.infura.io/v3/' + process.env.INFURA_TOKEN,
            accounts: [process.env.DEV_PRIVATE_KEY as string],
            gasPrice: 8000000000,
          },
          polygon: {
            url: 'https://polygon-mainnet.infura.io/v3/' + process.env.INFURA_TOKEN,
            accounts: {
              mnemonic: process.env.MNEMONIC as string,
            },
            gasPrice: 80000000000,
          },
          hardhat: {
            forking: {
              url: 'https://polygon-mainnet.infura.io/v3/' + process.env.INFURA_TOKEN,
            },
            accounts: {
              mnemonic: process.env.MNEMONIC as string,
            },
            gasPrice: 40000000000,
          },
        },
        solidity: {
          compilers: [
            {
              version: '0.8.17',
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
          apiKey: process.env.ETHERSCAN_TOKEN as string,
        },
      }
    : {
        solidity: {
          compilers: [
            {
              version: '0.8.17',
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
