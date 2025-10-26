import { Resolvers, Execution } from '../types/resolvers';
import { Execution as ExecutionModel } from '../models/Execution';
import { ToolRegistry } from '@clear-ai/shared';
import { ExecutionGraph } from '../workflows/ExecutionGraph';

const convertDocToObject = (doc: any) => {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    input: doc.input,
    output: doc.output,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

// In-memory storage for workflow results
const workflowExecutions = new Map<string, any>();

export const resolvers: Resolvers = {
  Query: {
    getExecution: async (_: any, args: { id: string }) => {
      const execution = await ExecutionModel.findById(args.id);
      return convertDocToObject(execution);
    },
    getExecutions: async (_: any, args: { limit?: number; offset?: number }) => {
      const executions = await ExecutionModel.find()
        .limit(args.limit || 10)
        .skip(args.offset || 0)
        .sort({ createdAt: -1 });
      return executions.map(convertDocToObject).filter(Boolean) as Execution[];
    },
  },
  Mutation: {
    createExecution: async (_: any, args: { input: string; output: string }) => {
      const execution = new ExecutionModel({ input: args.input, output: args.output });
      await execution.save();
      return convertDocToObject(execution)!;
    },
    updateExecution: async (_: any, args: { id: string; input?: string; output?: string }) => {
      const updateData: any = {};
      if (args.input !== undefined) updateData.input = args.input;
      if (args.output !== undefined) updateData.output = args.output;

      const execution = await ExecutionModel.findByIdAndUpdate(args.id, updateData, { new: true });
      if (!execution) throw new Error('Execution not found');
      return convertDocToObject(execution)!;
    },
    deleteExecution: async (_: any, args: { id: string }) => {
      const result = await ExecutionModel.findByIdAndDelete(args.id);
      return !!result;
    },
    executeWithWorkflow: async (_: any, args: { plan: string; tools: string }) => {
      const registry = ToolRegistry.getInstance();
      await registry.ensureInitialized();

      const tools = JSON.parse(args.tools);
      const executionGraph = new ExecutionGraph({ toolRegistry: registry });
      const result = await executionGraph.invoke({ plan: args.plan, tools });

      const executionId = Date.now().toString();
      const executionWithResults = {
        id: executionId,
        plan: result.plan,
        totalExecutions: result.executions.length,
        successful: result.results.length,
        failed: result.errors.length,
        results: JSON.stringify(result.results),
        errors: result.errors,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in memory
      workflowExecutions.set(executionId, executionWithResults);

      return executionWithResults;
    },
  },
};
