# MCP Tool Discovery Usage

This shared package provides a centralized tool discovery system that automatically fetches tools from an Anthropic MCP (Model Context Protocol) server via gRPC.

## Setup

### 1. Environment Configuration

Set the following environment variables:

```env
MCP_SERVER_ADDRESS=localhost:50051
MCP_CONNECTION_TIMEOUT=5000
```

### 2. Start MCP Server

Ensure your MCP server is running and accessible at the configured address.

## Usage in Agents

### Basic Usage

```typescript
import { ToolRegistry } from '@clear-ai/shared';

// Get the singleton registry instance
const registry = ToolRegistry.getInstance();

// Ensure tools are initialized from MCP server
await registry.ensureInitialized();

// Get all available tools
const allTools = registry.getAllTools();

// Find a specific tool
const tool = registry.findTool('tool-name');

// Get tools by category
const webTools = registry.getToolsByCategory('web');
```

### Using with LLM Tool Selection

```typescript
import { ToolRegistry, LLMToolSelector, LLMClient } from '@clear-ai/shared';

// Initialize registry
const registry = ToolRegistry.getInstance();
await registry.ensureInitialized();

// Create your LLM client implementation
class MyLLMClient implements LLMClient {
  async selectTools(prompt: string, availableTools: ToolDefinition[]): Promise<string[]> {
    // Call your LLM API here
    // Return array of tool names
    return ['tool1', 'tool2'];
  }
}

// Create selector
const llmClient = new MyLLMClient();
const selector = new LLMToolSelector(llmClient);

// Select tools for a specific query
const query = "Search the web for information about TypeScript";
const selectedTools = await selector.selectTools(query, registry.getAllTools());
```

### Advanced Usage

```typescript
import { MCPClient, ToolRegistry, LLMToolSelector } from '@clear-ai/shared';

// Direct MCP client usage
const mcpClient = new MCPClient('localhost:50051');
const tools = await mcpClient.listTools('web-scraping');

// Register additional tools manually
const registry = ToolRegistry.getInstance();
registry.register({
  name: 'custom-tool',
  description: 'A custom tool',
  category: 'custom',
  parameters: {},
  output: {
    type: 'object',
    success: true,
    message: '',
    properties: {},
  },
});

// Get tool count
const count = registry.getToolCount();

// Close connections
registry.close();
```

## Architecture

### Components

1. **MCPClient**: gRPC client for communicating with MCP server
2. **ToolRegistry**: Singleton registry that auto-fetches and stores tools
3. **LLMToolSelector**: Helper for selecting tools using LLM

### Tool Definition

```typescript
interface ToolDefinition<T = any> {
  name: string;
  description: string;
  category?: string;
  parameters: Record<string, any>;
  inputSchema?: ToolSchema;
  outputSchema?: ToolSchema;
  output: ToolOutputDefinition<T>;
}
```

## Error Handling

```typescript
try {
  const registry = ToolRegistry.getInstance();
  await registry.ensureInitialized();
} catch (error) {
  console.error('Failed to initialize ToolRegistry:', error);
  // Handle MCP server connection failure
}
```

## Examples

### Planner Agent

```typescript
// In your planner-agent resolver
import { ToolRegistry, LLMToolSelector } from '@clear-ai/shared';

const resolvers = {
  Query: {
    getAvailableTools: async () => {
      const registry = ToolRegistry.getInstance();
      await registry.ensureInitialized();
      return registry.getAllTools();
    },
  },
  
  Mutation: {
    selectToolsForPlan: async (_: any, { query }: { query: string }) => {
      const registry = ToolRegistry.getInstance();
      await registry.ensureInitialized();
      
      const selector = new LLMToolSelector(yourLLMClient);
      return await selector.selectTools(query, registry.getAllTools());
    },
  },
};
```

### Executor Agent

```typescript
// In your executor-agent resolver
import { ToolRegistry } from '@clear-ai/shared';

const resolvers = {
  Mutation: {
    executeTool: async (_: any, { toolName, params }: ExecutionArgs) => {
      const registry = ToolRegistry.getInstance();
      await registry.ensureInitialized();
      
      const tool = registry.findTool(toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }
      
      // Execute tool with params
      return executeToolImplementation(tool, params);
    },
  },
};
```
