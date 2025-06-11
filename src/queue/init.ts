import Queue from "bull";
import { loadConfig } from "../config";
import { Task } from "../blockchain/avs";

const config = loadConfig();

const taskQueue = new Queue<Task<string>>("taskQueue", config.REDIS_URL);

export default taskQueue;
