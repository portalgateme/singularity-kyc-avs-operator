import { createPublicClient, http, parseAbiItem, PublicClient } from "viem";

import { Config, getOperatorAddress, loadConfig } from "../config";
import { getChain } from "./utils";
import kycAvsAbi from "./abis/kycAvs.abi";
import { getWalletClient } from "./client";
import { getLogger } from "../logger";
import { addToQueue } from "../queue/handle";
import {
  generateRegistrationSignature,
  generateTaskResponseSignature,
} from "./utils/signatures";
import { isWalletCompliant } from "./kyc/checker";

const logger = getLogger("AVS");
const config = loadConfig();

const avsConfig = {
  chainId: config.AVS_CONTRACT_CHAIN_ID,
  contractAddress: config.AVS_CONTRACT_ADDRESS,
  operatorAddress: getOperatorAddress(),
};

export interface Task<T extends bigint | string = bigint> {
  taskId: T;
  userAddress: `0x${string}`;
}

export interface TaskAnswer {
  isKyc: boolean;
}

async function taskRequiresAction(taskId: bigint, publicClient: PublicClient) {
  const task = await publicClient.readContract({
    address: avsConfig.contractAddress as `0x${string}`,
    abi: kycAvsAbi,
    functionName: "getTaskDetailsForOperatorListener",
    args: [taskId, avsConfig.operatorAddress],
  });

  // task[0] is isCompleted
  // task[1] is isAnswered
  // task[2] is userAddress

  const requiresAction = task[0] === false && task[1] === false;
  const userAddress = task[2];

  return { taskId, userAddress, requiresAction };
}

async function getHistoricalEventsFromBlockNumber(
  blockNumber: bigint | "latest",
  publicClient: PublicClient
) {
  const events = await publicClient.getLogs({
    address: avsConfig.contractAddress as `0x${string}`,
    event: parseAbiItem(
      "event TaskCreated(uint256 indexed taskId,address indexed userAddress,uint32 taskCreatedBlock,uint256 totalWeightAtCreation)"
    ),
    fromBlock: blockNumber,
  });

  return events;
}

export async function listenToAvsTasks() {
  const config = loadConfig();
  const rpc = config[
    `CHAIN_RPC_${avsConfig.chainId}` as keyof Config
  ] as string;

  const publicClient = createPublicClient({
    transport: http(rpc),
    chain: getChain(avsConfig.chainId),
  });

  logger.info(
    `Getting historical events from block number ${
      config.EVENTS_FROM_BLOCK_NUMBER ?? "latest"
    }`
  );

  const isBlockNumber = Number.isInteger(config.EVENTS_FROM_BLOCK_NUMBER);

  const events = await getHistoricalEventsFromBlockNumber(
    isBlockNumber
      ? BigInt(Number(config.EVENTS_FROM_BLOCK_NUMBER ?? 0))
      : "latest",
    publicClient
  );

  const taskIds = events
    .map((event) => {
      return event.args?.taskId;
    })
    .filter(Boolean) as bigint[];

  logger.info(`Found ${events.length} historical events`);
  logger.info("Filtering events to only have those awaiting action");

  const tasksRequiresAction = await Promise.all(
    taskIds.map((taskId) => {
      return taskRequiresAction(taskId, publicClient);
    })
  );

  const tasksRequiresActionFiltered = tasksRequiresAction.filter(
    (task) => task.requiresAction
  );

  logger.info(
    `Found ${tasksRequiresActionFiltered.length} tasks that require action`
  );

  for (const task of tasksRequiresActionFiltered) {
    addToQueue({
      taskId: task.taskId,
      userAddress: task.userAddress,
    });
  }

  logger.info("Added historical tasks to queue");

  logger.info(
    `Listening to AVS tasks on chain ${avsConfig.chainId} (${
      getChain(avsConfig.chainId).name
    }), ${avsConfig.contractAddress}, rpc: ${rpc}`
  );

  const unwatch = publicClient.watchContractEvent<
    typeof kycAvsAbi,
    "TaskCreated"
  >({
    abi: kycAvsAbi,
    eventName: "TaskCreated",
    address: avsConfig.contractAddress as `0x${string}`,
    onLogs: (logs) => {
      const tasks = logs.map((log) => {
        return (log as any).args as {
          taskId: bigint;
          userAddress: `0x${string}`;
        };
      });

      tasks.forEach((task) => {
        addToQueue({
          taskId: task.taskId,
          userAddress: task.userAddress,
        });
      });
    },
  });

  return unwatch;
}

export async function submitTaskAnswer(taskId: bigint, data: TaskAnswer) {
  const client = getWalletClient(avsConfig.chainId);

  if (!client) {
    throw new Error(`Client for chain ${avsConfig.chainId} is not defined`);
  }

  logger.info(
    `Submitting task answer for task ${taskId.toString()} with data ${JSON.stringify(
      data
    )}`
  );

  try {
    const operatorAddress = client.account.address;
    const signatureData = await generateTaskResponseSignature(
      taskId,
      data.isKyc,
      operatorAddress,
      avsConfig.contractAddress as `0x${string}`
    );

    const txHash = await client.writeContract({
      address: avsConfig.contractAddress as `0x${string}`,
      abi: kycAvsAbi,
      functionName: "submitResponse",
      // args: [taskId, data.isKyc, signatureData],
      args: [taskId, data.isKyc],
    });

    logger.info(
      `Task answer submitted for task ${taskId.toString()}. Tx: ${txHash} on chain ${
        avsConfig.chainId
      }`
    );
  } catch (error) {
    logger.error(
      `Error submitting task answer for task ${taskId.toString()}: ${error}`
    );
    throw error;
  }
}
