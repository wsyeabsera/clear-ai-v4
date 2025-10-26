# MCP Server

The Model Context Protocol (MCP) server provides a gRPC interface for tool execution.

## Overview

The MCP server is a gRPC-based service that exposes tools for creating and managing blog-related data. It acts as the execution layer for the Clear AI V4 system.

## Port

**Default**: 50051 (configurable via `MCP_SERVER_PORT`)

## gRPC Service Definition

Located in `packages/mcp-server/src/proto/mcp_tools.proto`:

```protobuf
syntax = "proto3";

service ToolService {
  rpc ListTools(Empty) returns (ToolList);
  rpc CallTool(CallToolRequest) returns (CallToolResponse);
}

message Empty {}

message ToolList {
  repeated Tool tools = 1;
}

message Tool {
  string name = 1;
  string description = 2;
  map<string, string> parameters = 3;
}

message CallToolRequest {
  string toolName = 1;
  map<string, string> parameters = 2;
}

message CallToolResponse {
  bool success = 1;
  string message = 2;
  string output = 3;
}
```

## Available Tools

### Create Author

Creates a new author in the database.

**Parameters:**
- `name` (required): Author's full name
- `email` (required): Author's email address (must be unique)
- `bio` (optional): Author's biography

**Example:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "bio": "Software engineer"
}
```

**Returns:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Alice",
  "email": "alice@example.com",
  "bio": "Software engineer",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Create Blog

Creates a new blog post.

**Parameters:**
- `authorId` (required): Author's ID (ObjectId)
- `title` (required): Blog post title
- `content` (required): Blog post content

**Example:**
```json
{
  "authorId": "507f1f77bcf86cd799439011",
  "title": "My First Post",
  "content": "This is my first blog post"
}
```

**Returns:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "authorId": "507f1f77bcf86cd799439011",
  "title": "My First Post",
  "content": "This is my first blog post",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Create Comment

Creates a comment on a blog post.

**Parameters:**
- `blogId` (required): Blog post ID (ObjectId)
- `authorId` (required): Comment author's ID (ObjectId)
- `content` (required): Comment content

**Example:**
```json
{
  "blogId": "507f1f77bcf86cd799439012",
  "authorId": "507f1f77bcf86cd799439011",
  "content": "Great post!"
}
```

**Returns:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "blogId": "507f1f77bcf86cd799439012",
  "authorId": "507f1f77bcf86cd799439011",
  "content": "Great post!",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Create Picture

Uploads a picture reference.

**Parameters:**
- `authorId` (required): Picture owner's ID (ObjectId)
- `url` (required): Picture URL
- `description` (optional): Picture description

**Example:**
```json
{
  "authorId": "507f1f77bcf86cd799439011",
  "url": "https://example.com/image.jpg",
  "description": "Profile picture"
}
```

## Communication Flow

```
Executor Agent          MCP Server          MongoDB
     |                       |                  |
     | CallTool(name, params)|                   |
     |--------------------->|                   |
     |                       | Save data         |
     |                       |----------------->|
     |                       |                  |
     |                       | Return result     |
     |                       |<-----------------|
     | CallToolResponse      |                  |
     |<---------------------|                   |
     |                       |                  |
```

## Implementation

Located in `packages/mcp-server/src/index.ts`:

```typescript
import grpc from '@grpc/grpc-js';
import { ToolServiceService } from './proto/mcp_tools_grpc_pb';

const server = new grpc.Server();

server.addService(ToolServiceService, {
  listTools: (call, callback) => {
    const tools = [
      { name: 'createAuthor', description: '...', parameters: {...} },
      { name: 'createBlog', description: '...', parameters: {...} },
      // ... other tools
    ];
    callback(null, { tools });
  },

  callTool: async (call, callback) => {
    const { toolName, parameters } = call.request;
    
    // Validate parameters
    // Execute tool
    // Return result
  },
});

server.bindAsync(`0.0.0.0:50051`, grpc.ServerCredentials.createInsecure(), () => {
  console.log('MCP Server running on port 50051');
  server.start();
});
```

## Error Handling

### Invalid Parameters

```json
{
  "success": false,
  "message": "Missing required parameter: name",
  "output": ""
}
```

### Database Error

```json
{
  "success": false,
  "message": "Duplicate key error: email already exists",
  "output": ""
}
```

### Tool Not Found

```json
{
  "success": false,
  "message": "Tool 'unknownTool' not found",
  "output": ""
}
```

## Next Steps

- Learn about [Agents](./agents.md)
- Explore [Tool Chaining](./tool-chaining.md)
- Read the [API Reference](../api-reference/tools)

