import { parse } from 'graphql';

export const typeDefs = parse(`
  type Plan @key(fields: "id") {
    id: ID!
    input: String!
    output: String!
    createdAt: String!
    updatedAt: String!
  }

  type Tool {
    name: String!
    description: String!
    category: String
    parameters: String
  }

  type PlanWithTools {
    id: ID!
    query: String!
    plan: String!
    selectedTools: [Tool!]!
    validationResult: String
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getPlan(id: ID!): Plan
    getPlans(limit: Int, offset: Int): [Plan]!
    getAvailableTools: [Tool!]!
  }

  type Mutation {
    createPlan(input: String!, output: String!): Plan!
    updatePlan(id: ID!, input: String, output: String): Plan!
    deletePlan(id: ID!): Boolean!
    createPlanWithWorkflow(query: String!): PlanWithTools!
  }
`);