import { submitTaskAnswer, Task } from "../blockchain/avs";
import { isWalletCompliant } from "../blockchain/kyc/checker";
import { getLogger } from "../logger";
import taskQueue from "./init";

const logger = getLogger("queue");

export function addToQueue(task: Task<bigint>) {
  const _task: Task<string> = {
    ...task,
    taskId: task.taskId.toString(),
  };

  logger.info(`Adding task ID:${_task.taskId} to queue.`);
  logger.debug(`Adding task to queue: ${JSON.stringify(_task)}`);

  taskQueue.add(_task);
}

export async function onNewTask(task: Task<bigint>) {
  const isCompliant = await isWalletCompliant(task.userAddress);
  return submitTaskAnswer(task.taskId, { isKyc: isCompliant });
}

taskQueue.process(async (job) => {
  const task: Task<bigint> = {
    ...job.data,
    taskId: BigInt(job.data.taskId),
  };

  return onNewTask(task);
});
