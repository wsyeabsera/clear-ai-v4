# Agents

Clear AI V4 uses two specialized agents: Planner and Executor.

## Overview

The system uses an agent-based architecture where each agent has a specific responsibility:

- **Planner Agent**: Analyzes queries and creates execution plans
- **Executor Agent**: Executes plans sequentially with parameter resolution

This separation enables:
- Independent scaling
- Fault isolation
- Specialized optimization
- Clear responsibilities

## Planner Agent

**Port**: 4001  
**Location**: `packages/planner-agent/`  
**Type**: GraphQL API

### Responsibilities

1. **Query Analysis**: Receives natural language queries
2. **LLM Integration**: Uses LLMs to understand intent
3. **Tool Selection**: Identifies required tools
4. **Parameter Extraction**: Extracts parameters from queries
5. **Dependency Analysis**: Determines execution order
6. **Plan Storage**: Saves plans to MongoDB

### Key Workflows

#### PlanningGraph

Located in `packages/planner-agent/src/workflows/PlanningGraph.ts`

**Workflow Steps:**

1. **Parse Query**: Receive natural language input
2. **Select Tools**: Query LLM for tool selection
3. **Extract Parameters**: Extract actual values
4. **Analyze Dependencies**: Determine order
5. **Generate IDs**: Create requestId and planId
6. **Store Plan**: Save to MongoDB

### GraphQL Schema

```graphql
type Query {
  plan(id: ID!): PlanWithRequest
  plansByRequestId(requestId: ID!): [PlanWithRequest!]!
}

type Mutation {
  createPlanWithRequestId(query: String!): PlanWithRequest!
}

type PlanWithRequest {
  id: ID!
  requestId: String!
  planId: String!
  query: String!
  plan: String!
  selectedTools: [ToolExecution!]!
  toolOrder: [String!]!
  executionState: String!
  executionResults: String
  createdAt: String!
  updatedAt: String!
}

type ToolExecution {
  toolName: String!
  parameters: String!
  dependsOn: String
  outputMapping: String
}
```

### Example Usage

```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      createPlanWithRequestId(
        query: \"Create author Bob, then create blog by Bob\"
      ) {
        requestId
        planId
        toolOrder
      }
    }"
  }'
```

**Response:**

```json
{
  "data": {
    "createPlanWithRequestId": {
      "requestId": "req_1234567890_abc123",
      "planId": "plan_1234567890_def456",
      "toolOrder": ["createAuthor", "createBlog"]
    }
  }
}
```

## Executor Agent

**Port**: 4002  
**Location**: `packages/executor-agent/`  
**Type**: GraphQL API

### Responsibilities

1. **Plan Retrieval**: Fetch plan by requestId
2. **Template Resolution**: Resolve `{{tool.field}}` references
3. **Sequential Execution**: Execute tools in order
4. **Output Passing**: Pass outputs between tools
5. **Result Aggregation**: Collect results
6. **State Updates**: Update execution state

### Key Workflows

#### ExecutionGraph

Located in `packages/executor-agent/src/workflows/ExecutionGraph.ts`

**Workflow Steps:**

1. **Fetch Plan**: Load plan from MongoDB
2. **Update State**: Mark as "in-progress"
3. **Resolve Templates**: Resolve parameter references
4. **Execute Tools**: Call MCP Server sequentially
5. **Aggregate Results**: Collect outputs
6. **Update State**: Mark as "completed" or "failed"

### GraphQL Schema

```graphql
type Query {
  execution(id: ID!): ExecutionWithChaining
}

type Mutation {
  executeByRequestId(requestId: ID!): ExecutionWithChaining!
}

type ExecutionWithChaining {
  id: ID!
  requestId: String!
  planId: String!
  totalExecutions: Int!
  successful: Int!
  failed: Int!
  results: String!
  outputs: String!
  errors: [String!]!
  createdAt: String!
  updatedAt: String!
}
```

### Example Usage

```bash
REQUEST_ID="req_1234567890_abc123"

curl -X POST http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation {
      executeByRequestId(requestId: \\\"$REQUEST_ID\\\") {
        successful
        failed
        errors
      }
    }\"
  }"
```

**Response:**

```json
{
  "data": {
    "executeByRequestId": {
      "successful": 2,
      "failed": 0,
      "errors": []
    }
  }
}
```

## Communication Flow

```
User Query
    |
    v
Planner Agent (4001)
    | - Analyze query
    | - Select tools
    | - Extract params
    | - Create plan
    |
    v
MongoDB (store plan)
    |
    v
Executor Agent (4002)
    | - Fetch plan
    | - Resolve templates
    | - Execute tools
    | - Update state
    |
    v
MCP Server (50051)
    | - Execute createAuthor
    | - Execute createBlog
    |
    v
MongoDB (save results)
```

## State Management

### Plan States

1. **pending**: Plan created, not yet executed
2. **in-progress**: Execution started
3. **completed**: All tools executed successfully
4. **failed**: One or more tools failed

### State Transitions

```
pending → in-progress → completed
                         |
                         v
                      failed
```

## Error Handling

### Planner Errors

- Invalid query syntax
- LLM response parsing failure
- No valid API keys
- Database connection errors

### Executor Errors

- Plan not found
- Template resolution failure
- Tool execution failure
- MCP server unavailable

## Next Steps

- Learn about [Tool Chaining](tool-chaining.md)
- Explore [LLM Integration](llm-integration)
- Read the [Quick Start](../getting-started/quick-start)

