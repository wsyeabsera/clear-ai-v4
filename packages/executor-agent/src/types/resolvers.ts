export type Execution = {
  id: string;
  input: string;
  output: string;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionWithResults = {
  id: string;
  plan: string;
  totalExecutions: number;
  successful: number;
  failed: number;
  results: string;
  errors: string[];
  createdAt: string;
  updatedAt: string;
};

export type ExecutionWithChaining = {
  id: string;
  requestId: string;
  planId: string;
  totalExecutions: number;
  successful: number;
  failed: number;
  results: string;
  outputs: string;
  errors: string[];
  createdAt: string;
  updatedAt: string;
};

export interface Resolvers {
  Query: {
    getExecution: (parent: any, args: { id: string }) => Promise<Execution | null>;
    getExecutions: (parent: any, args: { limit?: number; offset?: number }) => Promise<(Execution | null)[]>;
  };
  Mutation: {
    createExecution: (parent: any, args: { input: string; output: string }) => Promise<Execution>;
    updateExecution: (parent: any, args: { id: string; input?: string; output?: string }) => Promise<Execution>;
    deleteExecution: (parent: any, args: { id: string }) => Promise<boolean>;
    executeWithWorkflow: (parent: any, args: { plan: string; tools: string }) => Promise<ExecutionWithResults>;
    executeByRequestId: (parent: any, args: { requestId: string }) => Promise<ExecutionWithChaining>;
  };
  [key: string]: any;
}
