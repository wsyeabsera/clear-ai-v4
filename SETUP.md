# Setup Guide

## Prerequisites

- Node.js 18+
- MongoDB running locally (or update `MONGODB_URI` in your env files)
- Yarn package manager

## Installation

1. Install all dependencies for all packages:
```bash
yarn install
```

2. Create environment files (optional - defaults are provided):
- Copy `env.example` to `.env` in the root directory
- Or set environment variables individually

## Running the Services

### All Services Together
Run all three services (planner, executor, and gateway) concurrently:
```bash
yarn dev
```

### Individual Services

**Planner Agent** (port 4001):
```bash
yarn planner:dev
```

**Executor Agent** (port 4002):
```bash
yarn executor:dev
```

**Gateway** (port 4000):
```bash
yarn gateway:dev
```

## Access Points

- **Gateway** (stitched/unified API): http://localhost:4000/graphql
- **Planner Agent**: http://localhost:4001/graphql
- **Executor Agent**: http://localhost:4002/graphql

## Testing with GraphQL

### Using the Gateway (Recommended)
Access http://localhost:4000/graphql and run queries against both services.

**Example: Create a Plan**
```graphql
mutation {
  createPlan(input: "Plan input data", output: "Plan output data") {
    id
    input
    output
    createdAt
  }
}
```

**Example: Get all Plans**
```graphql
query {
  getPlans(limit: 10, offset: 0) {
    id
    input
    output
    createdAt
    updatedAt
  }
}
```

**Example: Create an Execution**
```graphql
mutation {
  createExecution(input: "Execution input", output: "Execution output") {
    id
    input
    output
    createdAt
  }
}
```

## Architecture

- **packages/shared**: Common types and utilities used across services
- **packages/planner-agent**: Manages Plans with CRUD operations (port 4001)
- **packages/executor-agent**: Manages Executions with CRUD operations (port 4002)
- **packages/gateway**: Microservices gateway that forwards requests to appropriate service (port 4000)

### How Gateway Works

The gateway acts as a **microservices gateway** that:
1. Accepts GraphQL queries and mutations
2. Forwards requests to the appropriate service based on the operation
3. Returns the combined result

**Example Flow:**
- Query `getPlan` → Forwards to planner-agent (port 4001)
- Query `getExecution` → Forwards to executor-agent (port 4002)
- Gateway returns unified results to the client

Each service runs independently with its own database connection. The gateway simply routes requests to the correct microservice, acting as a unified entry point for your distributed system.
