import { ToolExecution } from '../types/request';

export interface ParsedLLMResponse {
  tools: ToolExecution[];
  executionOrder: string[];
  plan: string;
}

export class LLMResponseParser {
  static parse(response: string): ParsedLLMResponse {
    try {
      // Clean the response - remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);

      // Validate structure
      if (!parsed.tools || !Array.isArray(parsed.tools)) {
        throw new Error('Invalid response: missing or invalid tools array');
      }

      if (!parsed.executionOrder || !Array.isArray(parsed.executionOrder)) {
        throw new Error('Invalid response: missing or invalid executionOrder array');
      }

      // Transform to our internal format
      const tools: ToolExecution[] = parsed.tools.map((tool: any) => ({
        toolName: tool.name,
        parameters: tool.parameters || {},
        dependsOn: tool.dependsOn || undefined,
        outputMapping: tool.outputMapping || undefined,
      }));

      return {
        tools,
        executionOrder: parsed.executionOrder,
        plan: parsed.plan || 'Execute tools in specified order',
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Raw response:', response);
      throw error;
    }
  }

  static validate(response: ParsedLLMResponse): boolean {
    if (!response.tools || response.tools.length === 0) {
      return false;
    }

    if (!response.executionOrder || response.executionOrder.length === 0) {
      return false;
    }

    // Check that all tools in executionOrder are in tools array
    const toolNames = new Set(response.tools.map((t) => t.toolName));
    for (const toolName of response.executionOrder) {
      if (!toolNames.has(toolName)) {
        console.error(`Tool ${toolName} in executionOrder not found in tools array`);
        return false;
      }
    }

    // Check for placeholder values
    for (const tool of response.tools) {
      for (const [key, value] of Object.entries(tool.parameters || {})) {
        const stringValue = String(value);
        // Check for common placeholder patterns
        // Skip validation for template references ({{...}})
        if (stringValue.startsWith('{{') && stringValue.endsWith('}}')) {
          continue;
        }
        
        if (
          stringValue.toLowerCase() === 'extracted' ||
          stringValue === 'extracted@example.com' ||
          stringValue.toLowerCase().includes('extracted')
        ) {
          console.error(`Invalid placeholder value for ${tool.toolName}.${key}: "${value}"`);
          return false;
        }
      }
    }

    return true;
  }
}
