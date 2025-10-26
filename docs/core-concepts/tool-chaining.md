# Tool Chaining System

The tool chaining system allows executing multiple tools in sequence, where the output of one tool serves as the input for another.

## Overview

Tool chaining enables complex multi-step operations using simple natural language queries. The system automatically:

1. Identifies tool dependencies
2. Determines execution order
3. Resolves parameter templates
4. Passes outputs between tools

## Request ID & Plan ID

Each execution plan gets unique identifiers for tracking:

### Request ID

A **Request ID** tracks an entire multi-tool operation across agents.

**Format**: `req_{timestamp}_{random}`

**Example**: `req_1704123456_abc123def`

**Purpose**:
- Links planning and execution phases
- Allows querying execution status
- Enables debugging of complex operations

### Plan ID

A **Plan ID** identifies a specific plan within a request.

**Format**: `plan_{timestamp}_{random}`

**Example**: `plan_1704123456_xyz789ghi`

**Purpose**:
- Unique identification in MongoDB
- Plan versioning
- Result tracking

## How It Works

### 1. Query Analysis

User submits a natural language query:

```graphql
mutation {
  createPlanWithRequestId(
    query: "Create author Alice with email alice@test.com, 
           then create blog by Alice titled Hello about world"
  ) {
    requestId
    planId
  }
}
```

### 2. Tool Selection

The LLM analyzes the query and selects tools:

```json
{
  "tools": [
    {
      "name": "createAuthor",
      "parameters": {
        "name": "Alice",
        "email": "alice@test.com"
      },
      "dependsOn": null
    },
    {
      "name": "createBlog",
      "parameters": {
        "authorId": "{{createAuthor._id}}",
        "title": "Hello",
        "content": "about world"
      },
      "dependsOn": "createAuthor"
    }
  ],
  "executionOrder": ["createAuthor", "createBlog"]
}
```

### 3. Execution Order

The system determines execution order using **topological sort**:

```
Dependencies:
  createBlog depends on createAuthor

Execution Order:
  1. createAuthor (no dependencies)
  2. createBlog (depends on createAuthor)
```

### 4. Template Resolution

Before executing each tool, templates are resolved:

**Before Resolution:**
```json
{
  "authorId": "{{createAuthor._id}}"
}
```

**After Execution of createAuthor:**
```json
{
  "output": {
    "_id": "507f1f77bcf86cd799439011"
  }
}
```

**After Resolution:**
```json
{
  "authorId": "507f1f77bcf86cd799439011"
}
```

### 5. Sequential Execution

Tools execute one by one, passing outputs forward:

```
Step 1: Execute createAuthor
  Input: {name: "Alice", email: "alice@test.com"}
  Output: {_id: "507f1f77bcf86cd799439011", ...}
  Save to: outputs.createAuthor

Step 2: Resolve templates for createBlog
  Template: {{createAuthor._id}}
  Resolved: 507f1f77bcf86cd799439011

Step 3: Execute createBlog
  Input: {authorId: "507f1f77bcf86cd799439011", title: "Hello", ...}
  Output: {_id: "507f1f77bcf86cd799439012", ...}
  Save to: outputs.createBlog

Step 4: Return results
  {createAuthor: {...}, createBlog: {...}}
```

## Template Syntax

### Basic Template

Access any field from a previous tool's output:

```
{{toolName.fieldName}}
```

**Examples:**

```javascript
// Access author ID
"{{createAuthor._id}}"

// Access blog ID
"{{createBlog._id}}"

// Access nested fields (if available)
"{{createBlog.title}}"
"{{createBlog.authorId}}"
```

### Multiple Templates

You can use multiple templates in a single parameter:

```json
{
  "message": "Created by {{createAuthor.name}} ({{createAuthor.email}})"
}
```

## Code Structure

### Planner Agent

Located in `packages/planner-agent/src/workflows/PlanningGraph.ts`

**Key Function**: `selectTools`

```typescript
private async selectTools(state: PlanningStateType): Promise<PlanningStateType> {
  // Query LLM for tool selection
  const llmResponse = await this.llmService.analyzeQuery(
    state.query,
    allTools,
    prompt
  );
  
  // Parse and validate response
  const parsed = LLMResponseParser.parse(llmResponse);
  
  // Return selected tools
  return { ...state, selectedTools: parsed.tools };
}
```

**Key Function**: `analyzeDependencies`

```typescript
analyzeDependencies(tools: any[]): {
  toolExecutions: ToolExecution[];
  toolOrder: string[];
} {
  // Convert to ToolExecution format
  const toolExecutions = tools.map(tool => ({
    toolName: tool.name,
    parameters: tool.parameters,
    dependsOn: tool.dependsOn,
    outputMapping: tool.outputMapping,
  }));
  
  // Topological sort for execution order
  const toolOrder = this.topologicalSort(toolExecutions);
  
  return { toolExecutions, toolOrder };
}
```

### Executor Agent

Located in `packages/executor-agent/src/workflows/ExecutionGraph.ts`

**Key Function**: `sequentialExecute`

```typescript
private async sequentialExecute(state: ExecutionStateType): Promise<ExecutionStateType> {
  const results: any[] = [];
  const outputs: Record<string, any> = {};
  
  // Execute each tool in order
  for (const execution of state.executions) {
    // Resolve templates in parameters
    const resolvedParams = this.resolveParameters(
      execution.parameters,
      outputs
    );
    
    // Execute tool via MCP
    const result = await mcpClient.callTool(
      execution.toolName,
      resolvedParams
    );
    
    // Store output for next tools
    outputs[execution.toolName] = JSON.parse(result.output);
    results.push(result);
  }
  
  return { ...state, results, previousOutputs: outputs };
}
```

**Key Function**: `resolveParameters`

```typescript
private resolveParameters(
  params: any,
  outputs: Record<string, any>
): any {
  const resolved: any = {};
  
  for (const [key, value] of Object.entries(params)) {
    const stringValue = String(value);
    
    // Check if it's a template
    if (stringValue.startsWith('{{') && stringValue.endsWith('}}')) {
      // Extract tool and field
      const match = stringValue.match(/\{\{(\w+)\.(\w+)\}\}/);
      if (match) {
        const [, toolName, field] = match;
        resolved[key] = outputs[toolName]?.[field] || value;
      }
    } else {
      resolved[key] = value;
    }
  }
  
  return resolved;
}
```

## Advanced Patterns

### Deep Chaining

Chain multiple dependent tools:

```
Query: "Create author, then blog by author, then comment on blog"

Execution:
  1. createAuthor → {_id: "auth_123"}
  2. createBlog(authorId: "{{createAuthor._id}}") → {_id: "blog_456"}
  3. createComment(blogId: "{{createBlog._id}}")
```

### Parallel Execution

Tools without dependencies can run in parallel (future feature):

```
Query: "Create authors Alice and Bob simultaneously"

Execution:
  createAuthor(Alice) ━━┓
                        ┃ → Both independent
  createAuthor(Bob) ━━━┛
```

### Conditional Execution

Based on outputs (future feature):

```javascript
// If blog creation succeeds, create comment
if (outputs.createBlog) {
  createComment(blogId: outputs.createBlog._id);
}
```

## Error Handling

### Tool Failure

If a tool fails:

1. Execution stops
2. Error recorded in `executionResults.errors`
3. State set to `failed`
4. No further tools execute

### Template Resolution Failure

If template cannot be resolved:

1. Original template value used
2. Warning logged
3. Execution continues (may fail downstream)

### Dependency Cycle Detection

Circular dependencies detected by topological sort:

```
Error: Circular dependency detected between tools
```

## Best Practices

1. **Clear Dependencies**: Explicitly specify `dependsOn`
2. **Descriptive Template Names**: Use `{{createAuthor._id}}` not `{{tool1.field1}}`
3. **Parameter Validation**: Ensure required parameters are present
4. **Error Handling**: Check execution results before proceeding
5. **Logging**: Use console logs for debugging

## Next Steps

- Learn about [LLM Integration](llm-integration)
- Explore [Parameter Resolution](advanced/parameter-resolution)
- Read the [API Reference](api-reference/planner-agent)

