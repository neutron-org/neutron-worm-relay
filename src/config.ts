import {
  CHAIN_ID_SEPOLIA,
  CHAIN_ID_ETH,
  ChainId,
  CHAIN_ID_NEUTRON,
} from "@certusone/wormhole-sdk";

function getChainId(chainName: string) {
  switch (chainName) {
    case "sepolia": {
      return CHAIN_ID_SEPOLIA;
    }
    case "ethereum": {
      return CHAIN_ID_ETH;
    }
    case "neutron": {
      return CHAIN_ID_NEUTRON;
    }
    default: {
      throw new Error("invalid chain name:" + chainName);
    }
  }
}

export type Config = {
  environment: string;

  ethChainID: ChainId;
  ethNetworkUrl: string;
  ethEmitterAddress: string;
  ethIsmAddress: string;

  cosmosChainID: ChainId;
  cosmosNetworkUrl: string;
  cosmosEmitterAddress: string;
  cosmosIsmAddress: string;
  cosmosHRP: string;
  cosmosGasPrice: string;
};

export function loadConfig(): Config {
  return {
    environment: process.env.ENVIRONMENT,
    ethEmitterAddress: process.env.ETH_EMITTER_ADDRESS,
    ethChainID: getChainId(process.env.ETH_CHAIN),
    ethIsmAddress: process.env.ETH_ISM_ADDRESS,
    ethNetworkUrl: process.env.ETH_NETWORK_URL,
    cosmosIsmAddress: process.env.COSMOS_ISM_ADDRESS,
    cosmosChainID: getChainId(process.env.COSMOS_CHAIN),
    cosmosEmitterAddress: process.env.COSMOS_EMITTER_ADDRESS,
    cosmosNetworkUrl: process.env.COSMOS_NETWORK_URL,
    cosmosHRP: process.env.COSMOS_HRP,
    cosmosGasPrice: process.env.COSMOS_GAS_PRICE,
  };
}
