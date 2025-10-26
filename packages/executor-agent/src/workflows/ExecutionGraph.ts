import { StateGraph, END } from '@langchain/langgraph';
import { ToolRegistry } from '@clear-ai/shared';
import { z } from 'zod';

// Define the state structure
const ExecutionState = z.object({
  plan: z.string(),
  tools: z.array(z.any()).default([]),
  executions: z.array(z.any()).default([]),
  toolOrder: z.array(z.string()).default([]),
  previousOutputs: z.record(z.any()).default({}),
  results: z.array(z.any()).default([]),
  errors: z.array(z.string()).default([]),
});

type ExecutionStateType = z.infer<typeof ExecutionState>;

interface ExecutionGraphConfig {
  toolRegistry: ToolRegistry;
}

export class ExecutionGraph {
  private graph: any;
  private toolRegistry: ToolRegistry;

  constructor(config: ExecutionGraphConfig) {
    this.toolRegistry = config.toolRegistry;
    this.graph = this.createGraph();
  }

  private prepareExecution(state: ExecutionStateType): ExecutionStateType {
    console.log('📋 Preparing execution for plan:', state.plan);
    console.log(`📦 Found ${state.tools.length} tools to execute`);

    // Mark all tools as ready for execution
    // Tools are already ToolExecution objects with toolName field
    const executions = state.tools.map((tool: any) => ({
      toolName: tool.toolName,
      parameters: tool.parameters,
      status: 'pending',
      result: null,
      error: null,
    }));

    return {
      ...state,
      executions,
    };
  }

  private async sequentialExecute(state: ExecutionStateType): Promise<ExecutionStateType> {
    console.log('🔗 Executing tools sequentially with chaining...');

    const results: any[] = [];
    const errors: string[] = [];
    const outputs: Record<string, any> = {};  // Store outputs for chaining

    // Execute in order
    for (const execution of state.executions) {
      const tool = this.toolRegistry.findTool(execution.toolName);

      if (!tool) {
        errors.push(`Tool "${execution.toolName}" not found`);
        continue;
      }

      try {
        // Parse parameters if they're a string (from MongoDB)
        let params = execution.parameters;
        if (typeof params === 'string') {
          params = JSON.parse(params);
        }

        console.log(`  Raw params before resolution:`, JSON.stringify(params, null, 2));
        console.log(`  Available outputs:`, Object.keys(outputs));

        // Resolve parameter templates
        const resolvedParams = this.resolveParameters(
          params,
          outputs
        );

        console.log(`  → Executing ${execution.toolName} with params:`, JSON.stringify(resolvedParams, null, 2));

        // Call MCP server
        const mcpClient = (this.toolRegistry as any).mcpClient;
        const result = await mcpClient.callTool(execution.toolName, resolvedParams);

        if (result.success) {
          const output = JSON.parse(result.output);
          outputs[execution.toolName] = output;  // Store for next tool

          results.push({
            toolName: execution.toolName,
            status: 'completed',
            result: output,
          });

          console.log(`  ✓ ${execution.toolName} completed:`, output);
          console.log(`  Updated outputs object:`, Object.keys(outputs));
        } else {
          console.error(`  ✗ ${execution.toolName} failed:`, result.message);
          errors.push(`${execution.toolName}: ${result.message}`);
        }
      } catch (error: any) {
        console.error(`  ✗ ${execution.toolName} error:`, error.message);
        console.error(`  Error details:`, error);
        errors.push(`${execution.toolName}: ${error.message}`);
      }
    }

    return {
      ...state,
      results,
      errors,
      previousOutputs: outputs,
    };
  }

  private resolveParameters(
    parameters: Record<string, any>,
    outputs: Record<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Template: {{toolName.field}}
        const path = value.slice(2, -2);
        const [toolName, ...fieldPath] = path.split('.');

        if (outputs[toolName]) {
          let result = outputs[toolName];
          for (const field of fieldPath) {
            result = result[field];
          }
          resolved[key] = result;
        } else {
          resolved[key] = value;  // Keep template if not resolved yet
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }


  private aggregateResults(state: ExecutionStateType): ExecutionStateType {
    console.log('🔗 Aggregating results...');

    const aggregated = {
      totalExecutions: state.executions.length,
      successful: state.results.length,
      failed: state.errors.length,
      results: state.results.map((exec: any) => ({
        tool: exec.toolName,
        output: exec.result,
      })),
    };

    console.log('✓ Aggregation complete:', {
      successful: aggregated.successful,
      failed: aggregated.failed,
    });

    return {
      ...state,
      results: [aggregated] as any[],
    };
  }

  private createGraph() {
    // Use Zod schema directly with StateGraph
    const workflow: any = new StateGraph(ExecutionState);

    // Add nodes
    workflow.addNode("prepare", this.prepareExecution.bind(this));
    workflow.addNode("execute", this.sequentialExecute.bind(this));
    workflow.addNode("aggregate", this.aggregateResults.bind(this));

    // Set entry point
    workflow.setEntryPoint("prepare");

    // Add edges
    workflow.addEdge("prepare", "execute");
    workflow.addEdge("execute", "aggregate");
    workflow.addEdge("aggregate", END);

    // Compile the graph
    return workflow.compile();
  }

  async invoke(input: { plan: string; tools: any[]; toolOrder?: string[] }): Promise<ExecutionStateType> {
    const state: ExecutionStateType = {
      plan: input.plan,
      tools: input.tools,
      executions: [],
      toolOrder: input.toolOrder || [],
      previousOutputs: {},
      results: [],
      errors: [],
    };

    const result = await this.graph.invoke(state);
    return result;
  }
}
