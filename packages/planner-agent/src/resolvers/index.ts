import { Resolvers, Plan } from '../types/resolvers';
import { Plan as PlanModel } from '../models/Plan';
import { ToolRegistry } from '@clear-ai/shared';
import { PlanningGraph } from '../workflows/PlanningGraph';

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

// In-memory storage for workflow results (in production, use MongoDB)
const workflowPlans = new Map<string, any>();

export const resolvers: Resolvers = {
  Query: {
    getPlan: async (_: any, args: { id: string }) => {
      const plan = await PlanModel.findById(args.id);
      return convertDocToObject(plan);
    },
    getPlans: async (_: any, args: { limit?: number; offset?: number }) => {
      const plans = await PlanModel.find()
        .limit(args.limit || 10)
        .skip(args.offset || 0)
        .sort({ createdAt: -1 });
      return plans.map(convertDocToObject).filter(Boolean) as Plan[];
    },
    getAvailableTools: async () => {
      const registry = ToolRegistry.getInstance();
      const tools = registry.getAllTools();
      return tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        category: tool.category || null,
        parameters: JSON.stringify(tool.parameters),
      }));
    },
  },
  Mutation: {
    createPlan: async (_: any, args: { input: string; output: string }) => {
      const plan = new PlanModel({ input: args.input, output: args.output });
      await plan.save();
      return convertDocToObject(plan)!;
    },
    updatePlan: async (_: any, args: { id: string; input?: string; output?: string }) => {
      const updateData: any = {};
      if (args.input !== undefined) updateData.input = args.input;
      if (args.output !== undefined) updateData.output = args.output;

      const plan = await PlanModel.findByIdAndUpdate(args.id, updateData, { new: true });
      if (!plan) throw new Error('Plan not found');
      return convertDocToObject(plan)!;
    },
    deletePlan: async (_: any, args: { id: string }) => {
      const result = await PlanModel.findByIdAndDelete(args.id);
      return !!result;
    },
    createPlanWithWorkflow: async (_: any, args: { query: string }) => {
      const registry = ToolRegistry.getInstance();
      await registry.ensureInitialized();

      const planningGraph = new PlanningGraph({ toolRegistry: registry });
      const result = await planningGraph.invoke({ query: args.query });

      const planId = Date.now().toString();
      const planWithTools = {
        id: planId,
        query: result.query,
        plan: result.plan || '',
        selectedTools: result.selectedTools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          category: tool.category || null,
          parameters: JSON.stringify(tool.parameters),
        })),
        validationResult: result.validationResult
          ? JSON.stringify(result.validationResult)
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in memory (in production, save to MongoDB)
      workflowPlans.set(planId, planWithTools);

      return planWithTools;
    },
  },
};
