import dotenv from "dotenv";
import { z } from "zod";
import { privateKeyToAccount } from "viem/accounts";
import { getLogger } from "./logger";

const baseConfigSchema = z.object({
  OPERATOR_PRIVATE_KEY: z.string().min(1, "OPERATOR_PRIVATE_KEY is required"),
  AVS_CONTRACT_ADDRESS: z.string().min(1, "AVS_CONTRACT_ADDRESS is required"),
  AVS_CONTRACT_CHAIN_ID: z
    .string()
    .min(1, "AVS_CONTRACT_CHAIN_ID is required")
    .transform((val) => Number(val)),

  CHAIN_IDS: z
    .string()
    .min(1, "CHAIN_IDS is required")
    .transform((val) =>
      val
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map(Number)
    ),
  CHAIN_RPC_1: z.string().optional(),
  CHAIN_RPC_42161: z.string().optional(),
  CHAIN_RPC_8453: z.string().optional(),
  CHAIN_RPC_31337: z.string().optional(),
  EVENTS_FROM_BLOCK_NUMBER: z
    .union([
      z
        .string()
        .regex(/^\d+$/, "Must be a string of digits or 'latest'")
        .transform(Number),
      z.literal("latest"),
    ])
    .optional(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform((val) => Number(val)),
});

const configSchema = baseConfigSchema.superRefine((data, ctx) => {
  const chainIds = data.CHAIN_IDS;

  if (chainIds.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "CHAIN_IDS array cannot be empty",
      path: ["CHAIN_IDS"],
    });
    return;
  }

  if (!chainIds.includes(data.AVS_CONTRACT_CHAIN_ID)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `AVS_CONTRACT_CHAIN_ID (${
        data.AVS_CONTRACT_CHAIN_ID
      }) must be one of the enabled chain IDs: ${chainIds.join(", ")}`,
      path: ["AVS_CONTRACT_CHAIN_ID"],
    });
  }

  chainIds.forEach((chainId) => {
    const rpcVarName = `CHAIN_RPC_${chainId}` as keyof typeof data;
    const rpcValue = data[rpcVarName] as string | undefined;

    if (!rpcValue || !rpcValue.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${rpcVarName} is required for chain ID ${chainId}`,
        path: [rpcVarName],
      });
    }
  });
});

export type Config = z.infer<typeof configSchema>;
const logger = getLogger("Config");

let _config: Config | null = null;

function handleConfigError(error: unknown): never {
  if (error instanceof z.ZodError) {
    logger.error("Configuration validation failed:");
    error.errors.forEach((err) => {
      logger.error(`- ${err.path.join(".")}: ${err.message}`);
    });
  } else {
    logger.error(
      "An unexpected error occurred during configuration loading:",
      error
    );
  }
  process.exit(1);
}

export function loadConfig(): Config {
  if (_config) {
    return _config;
  }

  dotenv.config();

  try {
    const parsedConfig = configSchema.parse(process.env);
    _config = parsedConfig;
    logger.info("Configuration loaded");
    return _config;
  } catch (error) {
    handleConfigError(error);
  }
}

export function isChainEnabled(chainId: number): boolean {
  const config = loadConfig();
  return config.CHAIN_IDS.includes(chainId);
}

export function getOperatorAddress(): `0x${string}` {
  const config = loadConfig();
  const pk = config.OPERATOR_PRIVATE_KEY;
  const account = privateKeyToAccount(pk as `0x${string}`);
  return account.address;
}
