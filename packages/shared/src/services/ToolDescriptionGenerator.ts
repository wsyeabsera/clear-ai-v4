import { ToolDefinition } from '../types/tools';

export class ToolDescriptionGenerator {
  static generateDescription(tool: ToolDefinition): string {
    const params = Object.entries(tool.parameters)
      .map(([key, value]) => {
        const type = typeof value === 'object' && value.type ? value.type : 'string';
        const required = value.required ? ' (required)' : ' (optional)';
        return `  - ${key}: ${type}${required}`;
      })
      .join('\n');

    return `
${tool.name}:
  Description: ${tool.description}
  Category: ${tool.category || 'general'}
  Parameters:
${params}`;
  }

  static generateList(tools: ToolDefinition[]): string {
    return tools.map((tool) => this.generateDescription(tool)).join('\n');
  }
}
