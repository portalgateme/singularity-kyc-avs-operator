import { Chain } from "viem";
import { mainnet, base, arbitrum, hardhat } from "viem/chains";

export function getChain(chainId: number): Chain {
  switch (chainId) {
    case mainnet.id:
      return mainnet;
    case base.id:
      return base;
    case arbitrum.id:
      return arbitrum;
    case hardhat.id:
      return hardhat;
    default:
      throw new Error(`Chain ${chainId} not supported`);
  }
}
