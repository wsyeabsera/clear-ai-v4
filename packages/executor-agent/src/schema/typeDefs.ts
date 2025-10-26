import { parse } from 'graphql';

export const typeDefs = parse(`
  type Execution @key(fields: "id") {
    id: ID!
    input: String!
    output: String!
    createdAt: String!
    updatedAt: String!
  }

  type ToolExecution {
    toolName: String!
    status: String!
    result: String
    error: String
  }

  type ExecutionWithResults {
    id: ID!
    plan: String!
    totalExecutions: Int!
    successful: Int!
    failed: Int!
    results: String!
    errors: [String!]!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getExecution(id: ID!): Execution
    getExecutions(limit: Int, offset: Int): [Execution]!
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

  type Mutation {
    createExecution(input: String!, output: String!): Execution!
    updateExecution(id: ID!, input: String, output: String): Execution!
    deleteExecution(id: ID!): Boolean!
    executeWithWorkflow(plan: String!, tools: String!): ExecutionWithResults!
    executeByRequestId(requestId: ID!): ExecutionWithChaining!
  }
`);
