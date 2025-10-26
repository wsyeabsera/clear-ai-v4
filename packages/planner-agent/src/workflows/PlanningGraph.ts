import { StateGraph, END } from '@langchain/langgraph';
import {
  ToolRegistry,
  ToolExecution,
  LLMService,
  LLMResponseParser,
  ToolDescriptionGenerator,
  buildToolSelectionPrompt,
} from '@clear-ai/shared';
import { LLM_CONFIG } from '../config/llm';
import { z } from 'zod';

// Define the state structure
const PlanningState = z.object({
  query: z.string(),
  selectedTools: z.array(z.any()).default([]),
  plan: z.string().optional(),
  validationResult: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()).default([]),
  }).optional(),
});

type PlanningStateType = z.infer<typeof PlanningState>;

interface PlanningGraphConfig {
  toolRegistry: ToolRegistry;
}

export class PlanningGraph {
  private graph: any;
  private toolRegistry: ToolRegistry;
  private llmService: LLMService;

  constructor(config: PlanningGraphConfig) {
    this.toolRegistry = config.toolRegistry;
    this.llmService = new LLMService(LLM_CONFIG);
    this.graph = this.createGraph();
  }

  private analyzeQuery(state: PlanningStateType): PlanningStateType {
    console.log('🔍 Analyzing query:', state.query);

    // Simple analysis - in production, use LLM
    const needsWebSearch = state.query.toLowerCase().includes('search') ||
                          state.query.toLowerCase().includes('find') ||
                          state.query.toLowerCase().includes('lookup');

    const calcMatch = state.query.toLowerCase().match(/\d+\s*[\+\-\*\/]\s*\d+/);
    const needsCalculation = state.query.toLowerCase().includes('calculate') ||
                            state.query.toLowerCase().includes('compute') ||
                            (calcMatch !== null);

    const needsFileAccess = state.query.toLowerCase().includes('file') ||
                           state.query.toLowerCase().includes('read') ||
                           state.query.toLowerCase().includes('write');

    return {
      ...state,
      plan: this.generatePlan(needsWebSearch, needsCalculation, needsFileAccess),
    };
  }

  private generatePlan(needsWeb: boolean, needsCalc: boolean, needsFile: boolean): string {
    const steps: string[] = [];

    if (needsWeb) {
      steps.push('1. Use web-search tool to find information');
    }

    if (needsCalc) {
      steps.push('2. Use calculator tool to perform calculations');
    }

    if (needsFile) {
      steps.push('3. Use file-reader or file-writer tool to access files');
    }

    if (steps.length === 0) {
      steps.push('Analyze the query to determine required tools');
    }

    return steps.join('\n');
  }

  private async selectTools(state: PlanningStateType): Promise<PlanningStateType> {
    console.log('🛠️  Selecting tools based on plan:', state.plan);

    const allTools = this.toolRegistry.getAllTools();
    
    // Check if API keys are available - REQUIRE them
    const hasGroqKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_key' && process.env.GROQ_API_KEY.startsWith('gsk_');
    const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key' && process.env.OPENAI_API_KEY.startsWith('sk-');
    
    if (!hasGroqKey && !hasOpenAIKey) {
      throw new Error('No valid API keys found. Please set GROQ_API_KEY or OPENAI_API_KEY in .env file');
    }

    // Use LLM to select tools intelligently
    const toolsDescription = ToolDescriptionGenerator.generateList(allTools);
    const prompt = buildToolSelectionPrompt(state.query, toolsDescription);

    console.log('🤖 Querying LLM for tool selection...');
    const llmResponse = await this.llmService.analyzeQuery(state.query, allTools as any[], prompt);

    console.log('📝 LLM Response:', llmResponse);
    const parsed = LLMResponseParser.parse(llmResponse);

    console.log('📦 Parsed response:', JSON.stringify(parsed, null, 2));

    if (!LLMResponseParser.validate(parsed)) {
      console.error('❌ Validation failed for parsed response');
      throw new Error('Invalid LLM response structure');
    }

    console.log(`✓ LLM selected ${parsed.tools.length} tools:`, parsed.executionOrder);

    // Convert to internal format
    const selectedTools = parsed.tools.map((exec: any) => {
      return {
        ...exec,
        parameters: exec.parameters,
      };
    });

    return {
      ...state,
      selectedTools: selectedTools as any[],
      plan: parsed.plan,
    };
  }

  private validatePlan(state: PlanningStateType): PlanningStateType {
    console.log('✅ Validating plan...');

    const errors: string[] = [];

    if (!state.plan || state.plan.trim() === '') {
      errors.push('Plan is empty');
    }

    if (state.selectedTools.length === 0) {
      errors.push('No tools selected');
    }

    const isValid = errors.length === 0;

    console.log(`Validation ${isValid ? 'passed' : 'failed'}:`, errors);

    return {
      ...state,
      validationResult: {
        isValid,
        errors,
      },
    };
  }

  private shouldRetry(state: PlanningStateType): "end" | "analyze" {
    const isValid = state.validationResult?.isValid ?? false;
    return isValid ? "end" : "analyze";
  }

  private createGraph() {
    // Use Zod schema directly with StateGraph
    const workflow: any = new StateGraph(PlanningState);

    // Add nodes - select is now async
    workflow.addNode("analyze", this.analyzeQuery.bind(this));
    workflow.addNode("select", async (state: PlanningStateType) => {
      return await this.selectTools(state);
    });
    workflow.addNode("validate", this.validatePlan.bind(this));

    // Set entry point
    workflow.setEntryPoint("analyze");

    // Add edges
    workflow.addEdge("analyze", "select");
    workflow.addEdge("select", "validate");
    
    // Add conditional edge based on validation
    workflow.addConditionalEdges(
      "validate",
      this.shouldRetry.bind(this),
      {
        end: END,
        analyze: "analyze",
      }
    );

    // Compile the graph
    return workflow.compile();
  }

  async invoke(input: { query: string }): Promise<PlanningStateType> {
    const state: PlanningStateType = {
      query: input.query,
      selectedTools: [],
    };

    const result = await this.graph.invoke(state);
    return result;
  }

  analyzeDependencies(tools: any[]): {
    toolExecutions: ToolExecution[];
    toolOrder: string[];
  } {
    // Convert tools from LLM response to ToolExecution format
    const toolExecutions: ToolExecution[] = tools.map((tool: any) => ({
      toolName: tool.toolName,
      parameters: tool.parameters,
      dependsOn: tool.dependsOn,
      outputMapping: tool.outputMapping,
    }));

    // Topological sort for execution order
    const toolOrder = this.topologicalSort(toolExecutions);

    return { toolExecutions, toolOrder };
  }

  private topologicalSort(tools: ToolExecution[]): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (tool: ToolExecution) => {
      if (visited.has(tool.toolName)) return;

      if (tool.dependsOn) {
        const dependency = tools.find(t => t.toolName === tool.dependsOn);
        if (dependency) visit(dependency);
      }

      visited.add(tool.toolName);
      order.push(tool.toolName);
    };

    tools.forEach(visit);
    return order;
  }
}
