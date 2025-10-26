# Clear AI V4 - Multi-Package GraphQL Backend

A monorepo architecture with yarn workspaces containing multiple GraphQL services.

## Structure

- **packages/shared**: Common types and utilities
- **packages/planner-agent**: GraphQL service for managing Plans
- **packages/executor-agent**: GraphQL service for managing Executions
- **packages/gateway**: Gateway server that stitches all services together

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
