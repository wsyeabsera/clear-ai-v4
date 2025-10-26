export type Plan = {
  id: string;
  input: string;
  output: string;
  createdAt: string;
  updatedAt: string;
};

export type Tool = {
  name: string;
  description: string;
  category: string | null;
  parameters: string;
};

export type PlanWithTools = {
  id: string;
  query: string;
  plan: string;
  selectedTools: Tool[];
  validationResult: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ToolExecution = {
  toolName: string;
  parameters: string;
  dependsOn: string | null;
  outputMapping: string | null;
};

export type PlanWithRequest = {
  id: string;
  requestId: string;
  planId: string;
  query: string;
  plan: string;
  selectedTools: ToolExecution[];
  toolOrder: string[];
  executionState: string;
  validationResult: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface Resolvers {
  Query: {
    getPlan: (parent: any, args: { id: string }) => Promise<Plan | null>;
    getPlans: (parent: any, args: { limit?: number; offset?: number }) => Promise<(Plan | null)[]>;
    getAvailableTools: () => Promise<Tool[]>;
  };
  Mutation: {
    createPlan: (parent: any, args: { input: string; output: string }) => Promise<Plan>;
    updatePlan: (parent: any, args: { id: string; input?: string; output?: string }) => Promise<Plan>;
    deletePlan: (parent: any, args: { id: string }) => Promise<boolean>;
    createPlanWithWorkflow: (parent: any, args: { query: string }) => Promise<PlanWithTools>;
    createPlanWithRequestId: (parent: any, args: { query: string }) => Promise<PlanWithRequest>;
  };
  [key: string]: any;
}
