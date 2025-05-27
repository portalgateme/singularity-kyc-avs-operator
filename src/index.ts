import { listenToAvsTasks } from "./blockchain/avs";
import { getLogger } from "./logger";
import taskQueue from "./queue/init";

async function main() {
  const logger = getLogger("Operator");
  logger.info("Starting operator...");

  try {
    const unwatch = await listenToAvsTasks();

    process.on("SIGINT", () => {
      logger.info("Shutting down operator gracefully...");
      taskQueue.close();
      unwatch();
      process.exit(0);
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to start operator: ${errorMessage}`);
    taskQueue.close();
    process.exit(1);
  }
}

main();
