# LLM Integration

Clear AI V4 uses Large Language Models (LLMs) to intelligently analyze natural language queries, select appropriate tools, and extract parameters.

## Overview

Instead of keyword-based pattern matching, the system uses LLMs to understand user intent semantically. This enables:

- Natural language queries instead of structured commands
- Intelligent tool selection based on context
- Automatic parameter extraction
- Dependency identification

## Supported Providers

### Groq (Recommended for Free Tier)

**Advantages:**
- Free tier with generous limits
- Fast response times
- Multiple powerful models
- No credit card required

**Setup:**
```bash
# Get API key from https://console.groq.com
GROQ_API_KEY=gsk_your_key_here
```

**Available Models:**
- `llama-3.1-8b-instant` - Fast, efficient
- `llama-3.1-70b-versatile` - More powerful
- `mixtral-8x7b-32768` - Long context

### OpenAI

**Advantages:**
- More consistent responses
- Better instruction following
- GPT-4 access

**Setup:**
```bash
# Get API key from https://platform.openai.com
OPENAI_API_KEY=sk-your_key_here
```

**Available Models:**
- `gpt-4o-mini` - Fast, cost-effective
- `gpt-4o` - Most capable
- `gpt-4` - Legacy powerful model

## How LLM Analysis Works

### 1. Query Receives

```javascript
query = "Create author Bob with email bob@test.com, then create blog by Bob"
```

### 2. Tool Descriptions Generated

```javascript
const tools = [
  {
    name: "createAuthor",
    description: "Creates a new author",
    parameters: {
      name: "Author's name",
      email: "Author's email"
    }
  },
  {
    name: "createBlog",
    description: "Creates a new blog",
    parameters: {
      authorId: "Author's ID",
      title: "Blog title",
      content: "Blog content"
    }
  }
];
```

### 3. Prompt Sent to LLM

```typescript
const prompt = `You are an intelligent planning assistant...

User Query: "${query}"

Available Tools:
${formatTools(tools)}

Analyze this query and respond with JSON only.`;
```

### 4. LLM Response

```json
{
  "tools": [
    {
      "name": "createAuthor",
      "parameters": {
        "name": "Bob",
        "email": "bob@test.com"
      },
      "dependsOn": null
    },
    {
      "name": "createBlog",
      "parameters": {
        "authorId": "{{createAuthor._id}}",
        "title": "extracted from query"
      },
      "dependsOn": "createAuthor"
    }
  ],
  "executionOrder": ["createAuthor", "createBlog"],
  "plan": "Create author Bob, then create blog by Bob"
}
```

### 5. Response Validated

The response is parsed and validated:

```typescript
// Parse JSON
const parsed = LLMResponseParser.parse(llmResponse);

// Validate structure
if (!LLMResponseParser.validate(parsed)) {
  throw new Error('Invalid LLM response structure');
}

// Check for placeholders
for (const tool of parsed.tools) {
  for (const [key, value] of Object.entries(tool.parameters)) {
    if (value === 'extracted' || value.includes('extracted')) {
      throw new Error('Placeholder value detected');
    }
  }
}
```

## Configuration

### Environment Variables

```env
# Required: Choose one or both
GROQ_API_KEY=gsk_your_key_here
OPENAI_API_KEY=sk-your_key_here

# Optional: Model selection
LLM_MODEL=llama-3.1-8b-instant  # For Groq
# LLM_MODEL=gpt-4o-mini          # For OpenAI

# Optional: LLM behavior
LLM_TEMPERATURE=0.7              # 0.0 = deterministic, 1.0 = creative
LLM_MAX_TOKENS=2000              # Maximum response length
```

### Configuration File

Located in `packages/planner-agent/src/config/llm.ts`:

```typescript
import { LLMConfig } from '@clear-ai/shared';

// Check which API key is available
const hasGroqKey = process.env.GROQ_API_KEY?.startsWith('gsk_');
const hasOpenAIKey = process.env.OPENAI_API_KEY?.startsWith('sk-');

// Prefer Groq if available (free)
const provider = hasGroqKey ? 'groq' : (hasOpenAIKey ? 'openai' : 'groq');
const model = process.env.LLM_MODEL || (
  provider === 'openai' ? 'gpt-4o-mini' : 'llama-3.1-8b-instant'
);

export const LLM_CONFIG: LLMConfig = {
  provider: provider as 'groq' | 'openai',
  model,
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '2000', 10),
};
```

## LLM Service Implementation

Located in `packages/shared/src/services/LLMService.ts`

### Class Structure

```typescript
export class LLMService {
  private groqClient?: Groq;
  private openaiClient?: OpenAI;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    // Initialize clients based on available API keys
    if (process.env.GROQ_API_KEY?.startsWith('gsk_')) {
      this.groqClient = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }

    if (process.env.OPENAI_API_KEY?.startsWith('sk-')) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }
}
```

### Main Method

```typescript
async analyzeQuery(
  query: string,
  tools: Array<{ name: string; description: string; parameters: Record<string, any> }>,
  systemPrompt: string
): Promise<string> {
  // Format tools for prompt
  const toolsDescription = this.formatToolsForPrompt(tools);
  
  // Build prompt
  const prompt = `${systemPrompt}

Available Tools:
${toolsDescription}

User Query: "${query}"

Analyze this query and respond with JSON only.`;

  // Call LLM
  const response = await this.callLLM(prompt);
  return response.content;
}
```

### Provider Selection

```typescript
private async callLLM(prompt: string): Promise<LLMResponse> {
  const { provider, model, temperature, max_tokens } = this.config;

  // Try primary provider
  if (provider === 'groq' && this.groqClient) {
    try {
      const response = await this.groqClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens,
        response_format: { type: 'json_object' }, // Force JSON
      });
      return { content: response.choices[0]?.message?.content || '' };
    } catch (error) {
      // Fallback to OpenAI
      if (this.openaiClient) {
        return this.callOpenAI(prompt, model, temperature, max_tokens);
      }
      throw error;
    }
  }

  // Try OpenAI
  if (this.openaiClient) {
    return this.callOpenAI(prompt, model, temperature, max_tokens);
  }

  throw new Error('No LLM provider available');
}
```

## Prompt Engineering

### Tool Selection Prompt

Located in `packages/shared/src/prompts/planning.ts`:

```typescript
export const TOOL_SELECTION_PROMPT = `You are an intelligent planning assistant...

CRITICAL: Extract ACTUAL parameter values from the query:
- If query says "Create author Bob with email bob@test.com", 
  extract {name: "Bob", email: "bob@test.com"}
- NEVER use placeholder values like "extracted"
- Extract REAL data from the query text

Return ONLY valid JSON in this exact format:
{
  "tools": [...],
  "executionOrder": [...],
  "plan": "..."
}`;
```

### Key Instructions

1. **Extract Real Values**: Never use "extracted", "extracted@example.com"
2. **Identify Dependencies**: Mark `dependsOn` when tools depend on others
3. **Create Templates**: Use `{{toolName.field}}` for dependencies
4. **Validate Tools**: Only use available tools
5. **Order Execution**: Sort tools by dependency

## Response Format

Expected JSON structure:

```typescript
interface ParsedLLMResponse {
  tools: Array<{
    name: string;
    parameters: Record<string, any>;
    dependsOn?: string;
    outputMapping?: Record<string, string>;
  }>;
  executionOrder: string[];
  plan: string;
}
```

Example:

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
        "title": "My Blog",
        "content": "about things"
      },
      "dependsOn": "createAuthor"
    }
  ],
  "executionOrder": ["createAuthor", "createBlog"],
  "plan": "Create author Alice, then create blog by Alice"
}
```

## Validation

Located in `packages/shared/src/services/LLMResponseParser.ts`:

```typescript
static validate(response: ParsedLLMResponse): boolean {
  // Check structure
  if (!response.tools || response.tools.length === 0) return false;
  if (!response.executionOrder || response.executionOrder.length === 0) return false;

  // Check execution order matches tools
  const toolNames = new Set(response.tools.map(t => t.name));
  for (const toolName of response.executionOrder) {
    if (!toolNames.has(toolName)) return false;
  }

  // Check for placeholder values
  for (const tool of response.tools) {
    for (const [key, value] of Object.entries(tool.parameters || {})) {
      const stringValue = String(value);
      
      // Skip template references
      if (stringValue.startsWith('{{') && stringValue.endsWith('}}')) continue;
      
      // Reject placeholders
      if (stringValue.toLowerCase().includes('extracted')) {
        return false;
      }
    }
  }

  return true;
}
```

## Best Practices

### 1. Provide Clear Tool Descriptions

```typescript
{
  name: "createAuthor",
  description: "Creates a new author in the database",
  parameters: {
    name: "The author's full name",
    email: "The author's email address (must be unique)"
  }
}
```

### 2. Use Descriptive Queries

❌ Bad: "do stuff"

✅ Good: "Create author Alice with email alice@test.com, then create blog by Alice titled Introduction about getting started"

### 3. Monitor API Usage

```bash
# Check Groq usage
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Check OpenAI usage
openai api usage list
```

### 4. Handle Errors Gracefully

```typescript
try {
  const plan = await planningGraph.invoke({ query });
} catch (error) {
  if (error.message.includes('Invalid LLM response')) {
    // Retry with simpler query
  }
}
```

## Troubleshooting

### "No valid API keys found"

**Error:**
```
Error: No valid API keys found
```

**Solution:**
1. Check `.env` file exists
2. Verify API key format (Groq: `gsk_...`, OpenAI: `sk-...`)
3. Restart services

### "Invalid LLM response structure"

**Error:**
```
Error: Invalid LLM response structure
```

**Solution:**
1. Check LLM returned valid JSON
2. Verify model is available
3. Check rate limits
4. Try different model

### "Placeholder value detected"

**Error:**
```
Error: Placeholder value detected
```

**Solution:**
1. Use more specific queries
2. Increase `LLM_TEMPERATURE` for creativity
3. Try different model

## Next Steps

- Learn about [MCP Server](./mcp-server.md)
- Explore [Parameter Resolution](../advanced/parameter-resolution)
- Read the [Advanced Topics](../advanced)

