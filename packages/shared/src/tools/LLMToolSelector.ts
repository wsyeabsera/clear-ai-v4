import { ToolDefinition } from '../types/tools';

export interface LLMClient {
  selectTools(prompt: string, availableTools: ToolDefinition[]): Promise<string[]>;
}

export class LLMToolSelector {
  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * Select the best tools based on user query using LLM
   */
  async selectTools(
    query: string,
    availableTools: ToolDefinition[]
  ): Promise<ToolDefinition[]> {
    const prompt = this.buildToolSelectionPrompt(query, availableTools);
    const selectedToolNames = await this.llmClient.selectTools(prompt, availableTools);
    
    return availableTools.filter((tool) => selectedToolNames.includes(tool.name));
  }

  /**
   * Format tools for LLM consumption
   */
  formatToolsForLLM(tools: ToolDefinition[]): string {
    return tools.map((tool) => this.formatTool(tool)).join('\n\n');
  }

  private formatTool(tool: ToolDefinition): string {
    let formatted = `Tool: ${tool.name}\n`;
    formatted += `Description: ${tool.description}\n`;
    
    if (tool.category) {
      formatted += `Category: ${tool.category}\n`;
    }
    
    if (tool.parameters && Object.keys(tool.parameters).length > 0) {
      formatted += `Parameters:\n`;
      Object.entries(tool.parameters).forEach(([key, param]) => {
        formatted += `  - ${key}: ${JSON.stringify(param)}\n`;
      });
    }
    
    return formatted;
  }

  private buildToolSelectionPrompt(
    query: string,
    availableTools: ToolDefinition[]
  ): string {
    const toolsList = this.formatToolsForLLM(availableTools);
    
    return `You are a tool selection assistant. Based on the following user query, select the most appropriate tools from the available list.

User Query: "${query}"

Available Tools:
${toolsList}

Instructions:
1. Analyze the user query to determine what actions are needed
2. Select only the tools that are relevant to fulfilling the query
3. Return a JSON array of tool names that should be used
4. If no tools are relevant, return an empty array []

Return your response as a JSON array of tool names only.`;
  }

  /**
   * Get tools by category
   */
  filterToolsByCategory(
    tools: ToolDefinition[],
    category: string
  ): ToolDefinition[] {
    return tools.filter((tool) => tool.category === category);
  }

  /**
   * Get relevant tools based on keywords
   */
  findToolsByKeywords(
    tools: ToolDefinition[],
    keywords: string[]
  ): ToolDefinition[] {
    const lowerKeywords = keywords.map((kw) => kw.toLowerCase());
    
    return tools.filter((tool) => {
      const searchText = `${tool.name} ${tool.description} ${tool.category || ''}`.toLowerCase();
      return lowerKeywords.some((keyword) => searchText.includes(keyword));
    });
  }
}
