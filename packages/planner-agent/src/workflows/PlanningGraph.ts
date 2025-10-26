import { StateGraph, END } from '@langchain/langgraph';
import { ToolRegistry } from '@clear-ai/shared';
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

  constructor(config: PlanningGraphConfig) {
    this.toolRegistry = config.toolRegistry;
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

  private selectTools(state: PlanningStateType): PlanningStateType {
    console.log('🛠️  Selecting tools based on plan:', state.plan);
    
    const allTools = this.toolRegistry.getAllTools();
    const selectedToolNames: string[] = [];
    
    // Simple tool selection based on query content
    const queryLower = state.query.toLowerCase();
    
    // If query mentions blog, post, article, content creation
    if (queryLower.includes('blog') || queryLower.includes('post') || queryLower.includes('article') || queryLower.includes('create')) {
      const createAuthor = allTools.find(t => t.name === 'createAuthor');
      const createBlog = allTools.find(t => t.name === 'createBlog');
      if (createAuthor) selectedToolNames.push('createAuthor');
      if (createBlog) selectedToolNames.push('createBlog');
    }
    
    // If query mentions author, writer
    if (queryLower.includes('author') || queryLower.includes('writer')) {
      const createAuthor = allTools.find(t => t.name === 'createAuthor');
      if (createAuthor) selectedToolNames.push('createAuthor');
    }
    
    // If query mentions comment or feedback
    if (queryLower.includes('comment') || queryLower.includes('feedback')) {
      const createComment = allTools.find(t => t.name === 'createComment');
      if (createComment) selectedToolNames.push('createComment');
    }
    
    // If query mentions picture or image
    if (queryLower.includes('picture') || queryLower.includes('image') || queryLower.includes('photo')) {
      const createPicture = allTools.find(t => t.name === 'createPicture');
      if (createPicture) selectedToolNames.push('createPicture');
    }
    
    // Fallback: if no specific tools found, look for any blog-related tool
    if (selectedToolNames.length === 0) {
      const anyBlogTool = allTools.find(t => t.category === 'blog' || t.category === 'author');
      if (anyBlogTool) selectedToolNames.push(anyBlogTool.name);
    }
    
    const selectedTools = allTools.filter(t => selectedToolNames.includes(t.name));
    
    console.log(`✓ Selected ${selectedTools.length} tools:`, selectedToolNames);
    
    return {
      ...state,
      selectedTools: selectedTools as any[],
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

    // Add nodes
    workflow.addNode("analyze", this.analyzeQuery.bind(this));
    workflow.addNode("select", this.selectTools.bind(this));
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
}
