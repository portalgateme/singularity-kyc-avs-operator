# EigenLayer AVS Operator

This document provides instructions on how to run the EigenLayer AVS operator.

## Docker Image

The operator is available as a publicly published Docker image on Docker Hub:
**[singularitynetwork/singularity-kyc-avs-operator](https://hub.docker.com/r/singularitynetwork/singularity-kyc-avs-operator)**

You can either use this pre-built image or build your own from the source code.

## Setup

1.  **Copy the Environment File:**
    Duplicate the example environment file and rename it to `.env`.

    ```bash
    cp .env.example .env
    ```

2.  **Configure Environment Variables:**
    Open the `.env` file and configure the necessary environment variables. Refer to the table below for an explanation of each variable.

    | Variable                   | Description                                                                                                                                                                                                                                                                                    | Default/Example Value          |
    | :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------- |
    | `NODE_ENV`                 | The environment for the Node.js application.                                                                                                                                                                                                                                                   | `production`                   |
    | `LOG_LEVEL`                | The logging level for the application.                                                                                                                                                                                                                                                         | `debug`                        |
    | `REDIS_URL`                | Redis connection string. Supports standard Redis, clusters, TLS, and authentication. Examples:<br/>- Standard: `redis://localhost:6379`<br/>- With auth: `redis://user:password@localhost:6379`<br/>- TLS: `rediss://localhost:6380`<br/>- Cluster: `redis://node1:6379,node2:6379,node3:6379` | `redis://redis:6379`           |
    | `OPERATOR_PRIVATE_KEY`     | The private key for the operator.                                                                                                                                                                                                                                                              |                                |
    | `CHAIN_IDS`                | Comma-separated list of chain IDs the operator will interact with.                                                                                                                                                                                                                             | `42161,1,8453`                 |
    | `CHAIN_RPC_1`              | RPC endpoint for Chain ID 1 (Ethereum Mainnet).                                                                                                                                                                                                                                                | `https://eth.llamarpc.com`     |
    | `CHAIN_RPC_42161`          | RPC endpoint for Chain ID 42161 (Arbitrum One).                                                                                                                                                                                                                                                | `https://arb1.arbitrum.io/rpc` |
    | `CHAIN_RPC_8453`           | RPC endpoint for Chain ID 8453 (Base).                                                                                                                                                                                                                                                         | `https://base.llamarpc.com`    |
    | `AVS_CONTRACT_CHAIN_ID`    | The chain ID where the AVS contract is deployed.                                                                                                                                                                                                                                               | `1`                            |
    | `AVS_CONTRACT_ADDRESS`     | The address of the AVS contract. **(You need to fill this value)**                                                                                                                                                                                                                             |                                |
    | `EVENTS_FROM_BLOCK_NUMBER` | The block number from which to start processing events.                                                                                                                                                                                                                                        | `1`                            |

## Running the Operator

You can run the operator using Docker with one of the following options:

### Option 1: Using the Public Docker Image

This is the easiest way to get started. The pre-built image is available on [Docker Hub](https://hub.docker.com/r/singularitynetwork/singularity-kyc-avs-operator).

#### With External Redis Instance

1.  **Ensure your external Redis instance is running and accessible.**

2.  **Configure `.env`:**
    Make sure your `.env` file has the correct `REDIS_URL` pointing to your external Redis instance. For example:

    ```env
    REDIS_URL=redis://your-external-redis-host:6379
    ```

3.  **Run the operator using the public image:**
    ```bash
    docker run --env-file .env --name avs-operator -d singularitynetwork/singularity-kyc-avs-operator:latest
    ```

#### Passing Environment Variables Directly

If you prefer not to use an `.env` file, you can pass environment variables directly:

```bash
docker run \
  -e NODE_ENV=production \
  -e LOG_LEVEL=debug \
  -e REDIS_URL=redis://your-redis-host:6379 \
  -e OPERATOR_PRIVATE_KEY=your_private_key \
  -e CHAIN_IDS=42161,1,8453 \
  -e CHAIN_RPC_1=https://eth.llamarpc.com \
  -e CHAIN_RPC_42161=https://arb1.arbitrum.io/rpc \
  -e CHAIN_RPC_8453=https://base.llamarpc.com \
  -e AVS_CONTRACT_CHAIN_ID=1 \
  -e AVS_CONTRACT_ADDRESS=your_avs_contract_address \
  -e EVENTS_FROM_BLOCK_NUMBER=1 \
  --name avs-operator \
  -d singularitynetwork/singularity-kyc-avs-operator:latest
```

#### Using Docker Compose with Public Image

You can also use Docker Compose with the public image. Update your `docker/docker-compose.yml`:

```yaml
services:
  operator:
    image: singularitynetwork/singularity-kyc-avs-operator:latest # Use public image
    env_file:
      - ../.env

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Then run:

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Option 2: Building from Source with External Redis

1.  **Ensure your external Redis instance is running and accessible.**

2.  **Configure `.env`:**
    Make sure your `.env` file has the correct `REDIS_URL` pointing to your external Redis instance. For example:

    ```env
    REDIS_URL=redis://your-external-redis-host:6379
    ```

    You can also use more advanced connection strings:

    - With authentication: `REDIS_URL=redis://username:password@your-redis-host:6379`
    - With TLS: `REDIS_URL=rediss://your-redis-host:6380`
    - For Redis Cluster: `REDIS_URL=redis://node1:6379,node2:6379,node3:6379`

3.  **Build the Docker image:**
    From the root of the project, run:

    ```bash
    docker build -t avs-operator -f docker/Dockerfile .
    ```

    Alternativly you can download the docker img from docker hub
    ```bash
    docker pull singularitynetwork/singularity-kyc-avs-operator
    ```
    
5.  **Run the operator container:**
    ```bash
    docker run --env-file .env --name avs-operator -d avs-operator
    ```
    This command runs the `avs-operator` image in detached mode (`-d`), names the container `avs-operator`, and passes all environment variables from your `.env` file.

### Option 3: Building from Source with Local Redis

To run the operator with a Redis instance managed by Docker Compose, use the following command from the root of the project:

```bash
docker-compose -f docker/docker-compose.yml up --build -d
```

This will build the operator image if it doesn't exist and start both the operator and Redis services in detached mode.

## Contracts infomation 
- ECDSAStakeRegistry Proxy: 0xD4b2352eE460593Cc0D2FA96C0c965B2Ee39e9Eb
- ECDSAStakeRegistry Implementation: 0x34d8a70E198F3830cF5aA9306c7d038A4e488E26
- KycAVS Proxy: 0x128e65461Ee2D794fc7F1A8c732dd9A275A8618c
- KycAVS Implementation: 0x6a0A2288a4E1F66F86c687aCE2d9248EC7e9056D
- Network: mainnet
This will build the operator image from source and start both the operator and Redis services in detached mode.

## Image Tags

The public Docker image supports the following tags:

- `latest` - Latest stable release
- `v<version>` - Specific version tags (e.g., `v1.0.0`)
- `main` - Latest build from the main branch (development)

To use a specific version:

```bash
docker run --env-file .env --name avs-operator -d singularitynetwork/singularity-kyc-avs-operator:v1.0.0
```
