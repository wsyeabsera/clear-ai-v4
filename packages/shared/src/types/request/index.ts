export interface ToolExecution {
  toolName: string;
  parameters: Record<string, any>;
  dependsOn?: string;  // Tool name this depends on
  outputMapping?: Record<string, string>;  // e.g., { "authorId": "{{createAuthor._id}}" }
}

export interface PlanWithRequest {
  _id: string;
  requestId: string;  // Cross-agent tracking
  planId: string;     // Plan-specific ID
  query: string;
  plan: string;
  selectedTools: ToolExecution[];
  toolOrder: string[];  // Execution order
  executionState: 'pending' | 'in-progress' | 'completed' | 'failed';
  executionResults?: Record<string, any>;  // Store tool outputs
  validationResult?: any;
  createdAt: Date;
  updatedAt: Date;
}
