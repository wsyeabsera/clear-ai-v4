import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { ToolDefinition, ToolSchema } from '../types/tools';

// gRPC stub types
interface Tool {
  name: string;
  description: string;
  category: string;
  inputSchema?: any;
  outputSchema?: any;
}

interface ListToolsRequest {
  category?: string;
}

interface ListToolsResponse {
  tools: Tool[];
}

interface ToolServiceClient {
  listTools(
    request: ListToolsRequest,
    callback: (error: grpc.ServiceError | null, response: ListToolsResponse) => void
  ): void;
}

export class MCPClient {
  private client: ToolServiceClient;
  private serverAddress: string;

  constructor(serverAddress?: string) {
    this.serverAddress = serverAddress || process.env.MCP_SERVER_ADDRESS || 'localhost:50051';
    this.client = this.createClient();
  }

  private createClient(): ToolServiceClient {
    const fs = require('fs');
    
    // Try multiple possible paths for proto file
    const possiblePaths = [
      path.resolve(__dirname, '../proto/mcp_tools.proto'), // dist/tools -> dist/proto  
      path.resolve(__dirname, '../../proto/mcp_tools.proto'), // dist/tools -> dist/proto (alternative)
      path.resolve(__dirname, '../../../src/proto/mcp_tools.proto'), // dist/tools -> src/proto
      path.resolve(process.cwd(), 'packages/shared/src/proto/mcp_tools.proto'), // absolute src
      path.resolve(process.cwd(), 'packages/shared/dist/proto/mcp_tools.proto'), // absolute dist
      // Try node_modules paths
      path.resolve(__dirname, '../../../../node_modules/@clear-ai/shared/dist/proto/mcp_tools.proto'), // from node_modules in packages
      path.resolve(process.cwd(), 'node_modules/@clear-ai/shared/dist/proto/mcp_tools.proto'), // from root node_modules
    ];
    
    console.log('Searching for proto file from:', __dirname);
    console.log('Current working directory:', process.cwd());
    
    let PROTO_PATH = '';
    for (const protoPath of possiblePaths) {
      try {
        if (fs.existsSync(protoPath)) {
          PROTO_PATH = protoPath;
          console.log(`✓ Found proto file at: ${PROTO_PATH}`);
          break;
        } else {
          console.log(`  - Not found: ${protoPath}`);
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    if (!PROTO_PATH) {
      throw new Error('Could not find proto file. Tried paths: ' + possiblePaths.join(', '));
    }

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const toolService = protoDescriptor.mcp.ToolService;

    return new toolService(
      this.serverAddress,
      grpc.credentials.createInsecure()
    ) as ToolServiceClient;
  }

  async listTools(category?: string): Promise<ToolDefinition[]> {
    return new Promise((resolve, reject) => {
      const request: ListToolsRequest = category ? { category } : {};

      this.client.listTools(request, (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        const tools: ToolDefinition[] = response.tools.map((tool: Tool) => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          parameters: this.convertSchemaToParameters(tool.inputSchema),
          inputSchema: this.convertSchema(tool.inputSchema),
          outputSchema: this.convertSchema(tool.outputSchema),
          output: {
            type: 'object',
            success: true,
            message: '',
            properties: {},
          },
        }));

        resolve(tools);
      });
    });
  }

  private convertSchemaToParameters(schema: any): Record<string, any> {
    if (!schema || !schema.properties) {
      return {};
    }

    const parameters: Record<string, any> = {};
    Object.keys(schema.properties).forEach((key) => {
      parameters[key] = {
        type: schema.properties[key],
        required: schema.required?.includes(key) || false,
      };
    });

    return parameters;
  }

  private convertSchema(schema: any): ToolSchema | undefined {
    if (!schema) return undefined;

    return {
      type: schema.type || 'object',
      properties: schema.properties || {},
      required: schema.required || [],
    };
  }

  getServerAddress(): string {
    return this.serverAddress;
  }

  close(): void {
    if (this.client && (this.client as any).close) {
      (this.client as any).close();
    }
  }
}
