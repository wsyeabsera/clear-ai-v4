# Architecture Overview

## Multi-Package GraphQL Backend with Microservices Gateway

This project implements a microservices architecture using Yarn workspaces with individual GraphQL services and a unified gateway.

## Package Structure

```
clear-ai-v4/
├── packages/
│   ├── shared/           # Shared utilities and types
│   ├── planner-agent/    # Plans microservice (port 4001)
│   ├── executor-agent/   # Executions microservice (port 4002)
│   └── gateway/          # Unified API gateway (port 4000)
```

## How It Works

### Individual Services

Each service (planner-agent and executor-agent) runs independently:
- Has its own MongoDB connection
- Exposes its own GraphQL schema
- Can be accessed directly at its dedicated port
- Implements complete CRUD operations for its model

### Gateway Pattern

The gateway acts as a **microservices gateway**:
1. Accepts GraphQL queries from clients
2. Determines which service handles the operation
3. Forwards the request to the appropriate service
4. Returns the unified result

**Routing Logic:**
- Queries/mutations for `Plan` → Forwards to planner-agent (port 4001)
- Queries/mutations for `Execution` → Forwards to executor-agent (port 4002)

## Benefits

1. **Service Independence**: Each service can be developed, deployed, and scaled independently
2. **Technology Flexibility**: Each service can use different technologies (currently all use the same stack)
3. **Team Autonomy**: Different teams can own different services
4. **Fault Isolation**: If one service fails, others continue operating
5. **Unified API**: Gateway provides a single endpoint for clients

## Data Flow

```
Client Request
    ↓
Gateway (port 4000)
    ↓
    ├─→ planner-agent (port 4001) → MongoDB
    └─→ executor-agent (port 4002) → MongoDB
    ↓
Client Response
```

## Running the System

### Option 1: Run All Services Together
```bash
yarn dev
```
Starts all three services simultaneously.

### Option 2: Run Services Individually
```bash
# Start planner agent only
yarn planner:dev

# Start executor agent only  
yarn executor:dev

# Start gateway only (make sure agents are running first)
yarn gateway:dev
```

## API Endpoints

- **Gateway**: http://localhost:4000/graphql (unified API)
- **Planner Agent**: http://localhost:4001/graphql (direct access)
- **Executor Agent**: http://localhost:4002/graphql (direct access)

## Model Schemas

### Plan (planner-agent)
```typescript
{
  id: ID!
  input: String!
  output: String!
  createdAt: String!
  updatedAt: String!
}
```

### Execution (executor-agent)
```typescript
{
  id: ID!
  input: String!
  output: String!
  createdAt: String!
  updatedAt: String!
}
```

## Environment Configuration

Each service can be configured via environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/clear-ai
PORT_PLANNER=4001
PORT_EXECUTOR=4002
PORT_GATEWAY=4000
PLANNER_SERVICE_URL=http://localhost:4001
EXECUTOR_SERVICE_URL=http://localhost:4002
```

## Future Enhancements

- Add authentication/authorization middleware
- Implement service discovery
- Add rate limiting to gateway
- Add request/response logging
- Implement service health checks
- Add caching layer
- Implement distributed tracing
