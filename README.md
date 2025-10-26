# Clear AI V4 - Multi-Package GraphQL Backend

A monorepo architecture with yarn workspaces containing multiple GraphQL services.

## 📚 Documentation

Comprehensive documentation is available at:
- **[Getting Started](docs/getting-started/installation.md)** - Installation and setup guide
- **[Quick Start](docs/getting-started/quick-start.md)** - Create your first execution plan
- **[Architecture](docs/getting-started/architecture-overview.md)** - System architecture and data flow
- **[Core Concepts](docs/core-concepts/tool-chaining.md)** - Tool chaining, LLM integration, MCP server
- **[API Reference](docs/api-reference/planner-agent.md)** - GraphQL schemas and types

## Structure

- **packages/shared**: Common types, utilities, and LLM services
- **packages/planner-agent**: LLM-powered planning service (port 4001)
- **packages/executor-agent**: Sequential execution service (port 4002)
- **packages/mcp-server**: gRPC tool execution server (port 50051)
- **packages/gateway**: Unified GraphQL gateway (port 4000)

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Create a `.env` file in each package directory (or use one at root):
```
MONGODB_URI=mongodb://localhost:27017/clear-ai
PORT_PLANNER=4001
PORT_EXECUTOR=4002
PORT_GATEWAY=4000
```

3. Run all services together:
```bash
yarn dev
```

4. Or run services individually:
```bash
yarn planner:dev    # Runs planner-agent on port 4001
yarn executor:dev   # Runs executor-agent on port 4002
yarn gateway:dev    # Runs gateway on port 4000
```

## Service URLs

- Gateway (stitched): http://localhost:4000
- Planner Agent: http://localhost:4001
- Executor Agent: http://localhost:4002

## Architecture

Each agent can run independently with its own GraphQL endpoint. The gateway uses schema stitching to combine all services into a single unified GraphQL API.
# clear-ai-v4
