import { StateGraph, END } from '@langchain/langgraph';
import { ToolRegistry } from '@clear-ai/shared';
import { z } from 'zod';

// Define the state structure
const ExecutionState = z.object({
  plan: z.string(),
  tools: z.array(z.any()).default([]),
  executions: z.array(z.any()).default([]),
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
    const executions = state.tools.map((tool: any) => ({
      toolName: tool.name,
      status: 'pending',
      result: null,
      error: null,
    }));
    
    return {
      ...state,
      executions,
    };
  }

  private async parallelExecute(state: ExecutionStateType): Promise<ExecutionStateType> {
    console.log('⚡ Executing tools in parallel...');
    
    const results: any[] = [];
    const errors: string[] = [];
    
    // Execute all tools in parallel
    const promises = state.executions.map(async (execution) => {
      const tool = this.toolRegistry.findTool(execution.toolName);
      
      if (!tool) {
        return {
          ...execution,
          status: 'error',
          error: `Tool "${execution.toolName}" not found`,
        };
      }
      
      try {
        // Mock tool execution
        const result = await this.executeTool(tool, execution.toolName);
        
        return {
          ...execution,
          status: 'completed',
          result,
        };
      } catch (error: any) {
        return {
          ...execution,
          status: 'error',
          error: error.message || 'Execution failed',
        };
      }
    });
    
    const executionResults = await Promise.all(promises);
    
    executionResults.forEach((exec) => {
      if (exec.status === 'completed') {
        results.push(exec);
      } else {
        errors.push(`${exec.toolName}: ${exec.error}`);
      }
    });
    
    console.log(`✓ Completed ${results.length}/${state.executions.length} executions`);
    
    return {
      ...state,
      executions: executionResults,
      results,
      errors,
    };
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

  private async executeTool(_tool: any, toolName: string): Promise<any> {
    // Mock tool execution - in production, call MCP server
    console.log(`  → Executing ${toolName}...`);
    
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock results based on tool
    switch (toolName) {
      case 'web-search':
        return { results: ['Mock search result'] };
      case 'calculator':
        return { result: 42 };
      case 'file-reader':
        return { content: 'Mock file content' };
      case 'file-writer':
        return { success: true };
      case 'weather-api':
        return { temperature: 72, conditions: 'Sunny' };
      default:
        return { message: 'Mock execution result' };
    }
  }

  private createGraph() {
    // Use Zod schema directly with StateGraph
    const workflow: any = new StateGraph(ExecutionState);

    // Add nodes
    workflow.addNode("prepare", this.prepareExecution.bind(this));
    workflow.addNode("execute", this.parallelExecute.bind(this));
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

  async invoke(input: { plan: string; tools: any[] }): Promise<ExecutionStateType> {
    const state: ExecutionStateType = {
      plan: input.plan,
      tools: input.tools,
      executions: [],
      results: [],
      errors: [],
    };

    const result = await this.graph.invoke(state);
    return result;
  }
}
