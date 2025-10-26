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
  };
  [key: string]: any;
}
