require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });
require("@nomicfoundation/hardhat-toolbox");

function normalizePrivateKey(key) {
  if (!key?.trim()) return [];
  const trimmed = key.trim();
  const withPrefix = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  return [withPrefix];
}

const config = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    soneiumMinato: {
      url: "https://rpc.minato.soneium.org",
      chainId: 1946,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    soneiumMainnet: {
      url: "https://rpc.soneium.org",
      chainId: 1868,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    inkonchain: {
      url: "https://rpc-gel.inkonchain.com",
      chainId: 57073,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    baseMainnet: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    unichainMainnet: {
      url: "https://mainnet.unichain.org",
      chainId: 130,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    megaethMainnet: {
      url: "https://mainnet.megaeth.com/rpc",
      chainId: 4326,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    litvmTestnet: {
      url: "https://liteforge.rpc.caldera.xyz/http",
      chainId: 4441,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: normalizePrivateKey(process.env.PRIVATE_KEY),
    },
  },
  etherscan: {
    apiKey: {
      inkonchain: "empty",
      baseMainnet: process.env.BASESCAN_API_KEY || "",
      unichainMainnet: "empty",
      megaethMainnet: "empty",
      litvmTestnet: "empty",
      arcTestnet: "empty",
    },
    customChains: [
      {
        network: "inkonchain",
        chainId: 57073,
        urls: {
          apiURL: "https://explorer.inkonchain.com/api",
          browserURL: "https://explorer.inkonchain.com",
        },
      },
      {
        network: "baseMainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "unichainMainnet",
        chainId: 130,
        urls: {
          apiURL: "https://uniscan.xyz/api",
          browserURL: "https://uniscan.xyz",
        },
      },
      {
        network: "megaethMainnet",
        chainId: 4326,
        urls: {
          apiURL: "https://megaeth.blockscout.com/api",
          browserURL: "https://megaeth.blockscout.com",
        },
      },
      {
        network: "litvmTestnet",
        chainId: 4441,
        urls: {
          apiURL: "https://liteforge.explorer.caldera.xyz/api",
          browserURL: "https://liteforge.explorer.caldera.xyz",
        },
      },
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
    ],
  },
};

module.exports = config;
