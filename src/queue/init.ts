import Queue from "bull";
import { loadConfig } from "../config";
import { Task } from "../blockchain/avs";

const config = loadConfig();

const taskQueue = new Queue<Task<string>>(
  "taskQueue",
  `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
);

export default taskQueue;
