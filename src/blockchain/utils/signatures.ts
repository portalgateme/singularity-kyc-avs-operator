import { keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { loadConfig } from "../../config";

export interface SignatureWithSaltAndExpiry {
  signature: `0x${string}`;
  salt: `0x${string}`;
  expiry: bigint;
}

export async function generateRegistrationSignature(
  operatorAddress: `0x${string}`,
  avsAddress: `0x${string}`
): Promise<SignatureWithSaltAndExpiry> {
  const config = loadConfig();
  const account = privateKeyToAccount(
    config.OPERATOR_PRIVATE_KEY as `0x${string}`
  );

  // Generate a random salt
  const salt = keccak256(
    toHex(Date.now().toString() + Math.random().toString())
  );

  // Set expiry to 1 day from now (in seconds)
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400);

  // Create the message to sign
  // The message format should match what the AVS contract expects
  const message = keccak256(
    toHex(
      `${operatorAddress.toLowerCase()}${avsAddress.toLowerCase()}${salt}${expiry.toString()}`
    )
  );

  // Sign the message
  const signature = await account.signMessage({
    message: { raw: message as `0x${string}` },
  });

  return {
    signature,
    salt,
    expiry,
  };
}

export async function generateTaskResponseSignature(
  taskId: bigint,
  isKyc: boolean,
  operatorAddress: `0x${string}`,
  avsAddress: `0x${string}`
): Promise<SignatureWithSaltAndExpiry> {
  const config = loadConfig();
  const account = privateKeyToAccount(
    config.OPERATOR_PRIVATE_KEY as `0x${string}`
  );

  // Generate a random salt
  const salt = keccak256(
    toHex(Date.now().toString() + Math.random().toString())
  );

  // Set expiry to 1 hour from now (in seconds)
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);

  // Create the message to sign
  // The message format should match what the AVS contract expects for task responses
  const message = keccak256(
    toHex(
      `${taskId.toString()}${
        isKyc ? "1" : "0"
      }${operatorAddress.toLowerCase()}${avsAddress.toLowerCase()}${salt}${expiry.toString()}`
    )
  );

  // Sign the message
  const signature = await account.signMessage({
    message: { raw: message as `0x${string}` },
  });

  return {
    signature,
    salt,
    expiry,
  };
}
