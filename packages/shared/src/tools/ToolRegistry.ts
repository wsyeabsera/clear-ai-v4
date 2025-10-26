import { MCPClient } from './MCPClient';
import { ToolDefinition } from '../types/tools';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();
  private mcpClient: MCPClient | null = null;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private async initializeFromMCP(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.mcpClient = new MCPClient();
      const tools = await this.mcpClient.listTools();

      tools.forEach((tool) => {
        this.register(tool);
      });

      this.initialized = true;
      console.log(`✓ ToolRegistry initialized with ${tools.length} tools from MCP server`);
    } catch (error) {
      console.error('Failed to initialize ToolRegistry from MCP server:', error);
      throw error;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeFromMCP();
    }

    return this.initializationPromise;
  }

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getTools(): ToolDefinition[] {
    return this.getAllTools();
  }

  findTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.findTool(name);
  }

  getToolsByCategory(category: string): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.category === category
    );
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  clear(): void {
    this.tools.clear();
    this.initialized = false;
  }

  getToolCount(): number {
    return this.tools.size;
  }

  close(): void {
    if (this.mcpClient) {
      this.mcpClient.close();
      this.mcpClient = null;
    }
  }
}
