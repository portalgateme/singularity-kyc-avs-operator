# Singularity KYC AVS Operator

A Docker container for running the Singularity KYC AVS (Actively Validated Services) operator on EigenLayer.

## Quick Start

```bash
# Pull the image
docker pull singularitynetwork/singularity-kyc-avs-operator:latest

# Run with environment file
docker run --env-file .env -d --name kyc-operator singularitynetwork/singularity-kyc-avs-operator:latest
```

## Environment Configuration

Create a `.env` file with the following required variables:

```env
# Node.js Environment
NODE_ENV=production
LOG_LEVEL=info

# Redis Configuration - Connection string supporting various formats
REDIS_URL=redis://localhost:6379

# Operator Configuration
OPERATOR_PRIVATE_KEY=your_private_key_here

# Blockchain Configuration
CHAIN_IDS=1,42161,8453
CHAIN_RPC_1=https://eth.llamarpc.com
CHAIN_RPC_42161=https://arb1.arbitrum.io/rpc
CHAIN_RPC_8453=https://base.llamarpc.com

# AVS Contract Configuration
AVS_CONTRACT_CHAIN_ID=1
AVS_CONTRACT_ADDRESS=your_contract_address_here

# Event Processing
EVENTS_FROM_BLOCK_NUMBER=latest
```

### Redis Connection Examples

The `REDIS_URL` environment variable supports various Redis configurations:

- **Standard**: `redis://localhost:6379`
- **With authentication**: `redis://username:password@redis-host:6379`
- **TLS enabled**: `rediss://redis-host:6380`
- **Redis Cluster**: `redis://node1:6379,node2:6379,node3:6379`

## Deployment Options

### Option 1: Standalone with External Redis

```bash
docker run -d \
  --name kyc-operator \
  --env-file .env \
  --restart unless-stopped \
  singularitynetwork/singularity-kyc-avs-operator:latest
```

### Option 2: With Docker Compose

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  operator:
    image: singularitynetwork/singularity-kyc-avs-operator:latest
    env_file:
      - .env
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

Then run:

```bash
docker-compose up -d
```

## Environment Variables Reference

| Variable                   | Description                          | Example                    |
| -------------------------- | ------------------------------------ | -------------------------- |
| `NODE_ENV`                 | Node.js environment                  | `production`               |
| `LOG_LEVEL`                | Logging verbosity                    | `info`, `debug`, `error`   |
| `REDIS_URL`                | Redis connection string              | `redis://redis:6379`       |
| `OPERATOR_PRIVATE_KEY`     | Your operator's private key          | `0x...`                    |
| `CHAIN_IDS`                | Comma-separated chain IDs            | `1,42161,8453`             |
| `CHAIN_RPC_*`              | RPC endpoints for each chain         | `https://eth.llamarpc.com` |
| `AVS_CONTRACT_CHAIN_ID`    | Chain where AVS contract is deployed | `1`                        |
| `AVS_CONTRACT_ADDRESS`     | AVS contract address                 | `0x...`                    |
| `EVENTS_FROM_BLOCK_NUMBER` | Starting block for event processing  | `latest` or block number   |

## Supported Chains

- **Ethereum Mainnet** (Chain ID: 1)
- **Arbitrum One** (Chain ID: 42161)
- **Base** (Chain ID: 8453)
- **Custom chains** (configure via `CHAIN_RPC_*` variables)

## Logging

Logs are written to:

- **Console**: Structured JSON logs for production
- **Files** (production mode):
  - `logs/combined.log` - All logs
  - `logs/error.log` - Error logs only
  - `logs/exceptions.log` - Unhandled exceptions
  - `logs/rejections.log` - Unhandled promise rejections

To view logs:

```bash
# Follow container logs
docker logs -f kyc-operator

# Access log files (if mounted)
docker exec kyc-operator cat logs/combined.log
```

## Health Monitoring

The operator will:

- Connect to Redis on startup
- Listen for blockchain events
- Process KYC validation tasks
- Submit responses to the AVS contract

Monitor the container logs for successful startup messages and task processing.

## Security Considerations

1. **Private Key Protection**: Store `OPERATOR_PRIVATE_KEY` securely
2. **Network Security**: Ensure Redis is not publicly accessible
3. **Resource Limits**: Set appropriate memory/CPU limits for production
4. **Updates**: Regularly update to the latest image version

## Troubleshooting

### Common Issues

**Connection Errors**:

- Verify Redis URL and accessibility
- Check RPC endpoints are responsive
- Ensure private key has sufficient funds for gas

**Permission Errors**:

- Container runs as non-root user `appuser`
- Ensure mounted volumes have correct permissions

**Build from Source**:

```bash
git clone https://github.com/your-repo/singularity-kyc-avs-operator
cd singularity-kyc-avs-operator
docker build -t local/kyc-operator -f docker/Dockerfile .
```

## Support

- **Repository**: [GitHub Repository URL]
- **Documentation**: [Documentation URL]
- **Issues**: [GitHub Issues URL]

## License

[Your License Here]
