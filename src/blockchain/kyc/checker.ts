import { simulateContract } from "viem/actions";

import { getLogger } from "../../logger";
import { loadConfig } from "../../config";
import { getWalletClient } from "../client";
import { accessPortalDeployments } from "./deployments";

import abi from "../abis/accessPortal.abi";

const logger = getLogger("KYC");

async function checkChainCompliance(chainId: number, wallet: `0x${string}`) {
  const client = getWalletClient(chainId);
  if (!client) {
    throw new Error(`Client for chain ${chainId} is not defined`);
  }

  const deployment = accessPortalDeployments[chainId];
  if (!deployment) {
    throw new Error(`Deployment for chain ${chainId} is not defined`);
  }

  const response = await simulateContract(client, {
    abi,
    address: deployment,
    functionName: "isAuthorized",

    // first address is subject, second is user
    args: [wallet, wallet],
  });

  return response.result;
}

export async function isWalletCompliant(wallet: `0x${string}`) {
  const config = loadConfig();
  const chainIds = config.CHAIN_IDS;

  if (chainIds.length === 0) {
    throw new Error("CHAIN_IDS are not defined");
  }

  const sanitizedChainIds = chainIds.filter((chainId) => chainId !== 31337);
  const complianceStatusPromises = sanitizedChainIds.map(async (chainId) => {
    try {
      const isCompliant = await checkChainCompliance(chainId, wallet);
      logger.info(
        `Chain ${chainId} responded with: ${isCompliant} for wallet ${wallet}`
      );
      return isCompliant;
    } catch (error) {
      logger.error(
        `Error checking compliance for chain ${chainId} and wallet ${wallet}:`,
        error
      );
      return false;
    }
  });

  const complianceStatuses = await Promise.all(complianceStatusPromises);
  return complianceStatuses.some((status) => status);
}
