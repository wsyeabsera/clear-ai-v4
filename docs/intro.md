# Introduction

Welcome to **Clear AI V4** - a multi-package GraphQL backend with LLM-powered tool chaining capabilities.

## What is Clear AI V4?

Clear AI V4 is an intelligent orchestration system that allows you to execute complex multi-tool workflows using natural language queries. The system uses Large Language Models (LLMs) to understand user intent, select appropriate tools, extract parameters, and execute them in the correct sequence with proper data chaining.

## Key Features

- **LLM-Powered Planning**: Uses Groq or OpenAI to intelligently parse natural language queries
- **Tool Chaining**: Automatically chains tool executions with output dependency resolution
- **Request ID Tracking**: Unique identifiers for tracking complete multi-tool operations
- **Sequential Execution**: Executes tools in topological order based on dependencies
- **Parameter Resolution**: Templates (e.g., `{{toolName._id}}`) automatically resolve to actual values
- **GraphQL API**: Modern GraphQL interface for all operations
- **Microservices Architecture**: Independent agents for planning and execution
- **MCP Integration**: gRPC-based Model Context Protocol for tool management

## System Components

```
┌─────────────────────────────────────────────────────────┐
│                     User Query                           │
│ "Create author Bob, then create blog by Bob titled..."  │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   Planner Agent       │
          │  (LLM Analysis)       │
          │  4001                │
          └──────────┬─────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   Execution Plan     │
          │   - Tool Chain       │
          │   - Parameters       │
          │   - Dependencies     │
          └──────────┬─────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   Executor Agent     │
          │  (Sequential Chain)  │
          │  4002                │
          └──────────┬─────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   MCP Server         │
          │  (gRPC Tools)        │
          │  50051               │
          └──────────┬─────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   MongoDB            │
          │  (Data Storage)      │
          └──────────────────────┘
```

## Quick Example

```graphql
# 1. Create a plan with natural language
mutation {
  createPlanWithRequestId(
    query: "Create author Alice with email alice@test.com, 
           then create blog by Alice titled New Blog about AI"
  ) {
    requestId
    planId
    selectedTools {
      toolName
      parameters
      dependsOn
    }
  }
}

# 2. Execute the plan
mutation {
  executeByRequestId(requestId: "req_...") {
    successful
    failed
    outputs
  }
}
```

## Who Is This For?

- **Developers** building AI-powered applications that need multi-step tool orchestration
- **Teams** requiring intelligent task planning and execution
- **Architects** interested in microservices patterns with LLM integration
- **Anyone** who wants to chain MCP tools with automatic dependency resolution

## What You'll Learn

In this documentation, you'll learn how to:

1. Set up and configure the Clear AI V4 system
2. Create execution plans from natural language queries
3. Execute tool chains with automatic parameter resolution
4. Integrate LLM providers (Groq, OpenAI)
5. Extend the system with custom tools
6. Debug and optimize tool execution

## Next Steps

Ready to get started? Head over to the [Installation Guide](getting-started/installation) to set up your environment.

