import { privateKeyToAccount } from "viem/accounts";
import { http, createWalletClient } from "viem";

import { loadConfig, isChainEnabled, Config } from "../config";
import { getChain } from "./utils";

const clients: Record<
  number,
  ReturnType<typeof createWalletClientFromPrivateKey>
> = {};

function createWalletClientFromPrivateKey(chainId: number) {
  if (!isChainEnabled(chainId)) {
    return null;
  }

  const config = loadConfig();
  const pk = config.OPERATOR_PRIVATE_KEY;
  const chainRpc = config[`CHAIN_RPC_${chainId}` as keyof Config];

  const account = privateKeyToAccount(pk as `0x${string}`);

  return createWalletClient({
    account,
    chain: getChain(chainId),
    transport: http(chainRpc as string),
  });
}

export function getWalletClient(chainId: number) {
  if (!clients[chainId]) {
    clients[chainId] = createWalletClientFromPrivateKey(chainId);
  }

  return clients[chainId];
}
