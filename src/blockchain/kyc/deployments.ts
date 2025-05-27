import { mainnet, base, arbitrum, hardhat } from "viem/chains";

export const accessPortalDeployments: {
  [chainId: number]: `0x${string}`;
} = {
  [mainnet.id]: "0x82A5439B451D545E747314C17509B693e14B6b4F",
  [base.id]: "0xFa368E046B4051582662f7d1C033756dB55058cF",
  [arbitrum.id]: "0x7e230aa15db2C0B6E293abBa3e0d278f4B612fC4",
};
