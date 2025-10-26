export interface ToolDefinition<T = any> {
  name: string;
  description: string;
  category?: string;
  parameters: Record<string, any>;
  inputSchema?: ToolSchema;
  outputSchema?: ToolSchema;
  output: ToolOutputDefinition<T>;
}

export interface ToolOutputDefinition<T> {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'null';
  success: boolean;
  message: string;
  properties: Record<string, any | T>;
}

export interface ToolSchema {
  type: string;
  properties: Record<string, string>;
  required?: string[];
}