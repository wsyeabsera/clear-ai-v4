# Setup Instructions for LLM Integration

## Current Status

✅ **Implementation Complete**
- All static/keyword-based code removed
- LLM validation in place
- Enhanced prompts and parameter extraction
- Comprehensive error handling and logging

## Requirements

The system now **requires valid API keys** to operate:

### Required Environment Variables
```bash
# Option 1: Groq (recommended - fast and free tier)
export GROQ_API_KEY="gsk_your_actual_key_here"

# Option 2: OpenAI
export OPENAI_API_KEY="sk-your_actual_key_here"
```

### How to Get API Keys

1. **Groq (Free tier available)**
   - Go to https://console.groq.com/
   - Sign up (free tier available)
   - Create API key
   - Format: `gsk_...`

2. **OpenAI**
   - Go to https://platform.openai.com/
   - Sign up
   - Create API key
   - Format: `sk-...`

## Setup Instructions

### Step 1: Add API Keys to Environment

**Option A: Using `.env` files** (Recommended)
```bash
# Edit the .env files in each package directory
nano packages/planner-agent/.env
nano packages/executor-agent/.env
```

Replace the placeholder with your actual key:
```env
GROQ_API_KEY=gsk_your_actual_key_here
# or
OPENAI_API_KEY=sk-your_actual_key_here
```

**Option B: Export environment variables**
```bash
export GROQ_API_KEY="gsk_your_actual_key_here"
export OPENAI_API_KEY="sk-your_actual_key_here"

# Restart the services
cd packages/planner-agent && yarn dev
cd packages/executor-agent && yarn dev
```

### Step 2: Restart Services

The services need to be restarted to pick up the new API keys:

```bash
# Stop existing services (Ctrl+C in their terminals)
# Then restart:

# Terminal 1: MCP Server
cd packages/mcp-server && yarn start

# Terminal 2: Planner Agent  
cd packages/planner-agent && yarn dev

# Terminal 3: Executor Agent
cd packages/executor-agent && yarn dev

# Terminal 4: Gateway (optional)
cd packages/gateway && yarn dev
```

### Step 3: Test the System

Send a test query:
```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { 
      createPlanWithRequestId(query: \"Create author Bob with email bob@test.com, then create blog by Bob titled TypeScript Guide about TypeScript programming\") 
      { 
        requestId 
        planId 
        query 
        toolOrder
        selectedTools { 
          toolName 
          dependsOn 
        } 
      } 
    }"
  }' | jq .
```

Then execute the plan:
```bash
curl -X POST http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { 
      executeByRequestId(requestId: \"req_...\") 
      { 
        successful 
        failed 
        errors 
        outputs 
      } 
    }"
  }' | jq .
```

## What to Expect

### ✅ With Valid API Keys

The LLM will extract **real parameter values**:
- Query: "Create author Bob with email bob@test.com"
- Extracted: `{name: "Bob", email: "bob@test.com"}`
- NOT: `{name: "extracted", email: "extracted@example.com"}`

### ❌ Without Valid API Keys

The system will return:
```json
{
  "errors": [{
    "message": "No valid API keys found. Please set GROQ_API_KEY or OPENAI_API_KEY in .env file"
  }]
}
```

## Verification

Check the logs to verify API keys are loaded:
```
✓ Groq client initialized
✓ OpenAI client initialized
```

Or if no keys:
```
⚠️  No valid LLM API keys found. Set GROQ_API_KEY or OPENAI_API_KEY in .env
```

## Troubleshooting

### "No valid API keys found"
- Verify the API key format (Groq: `gsk_...`, OpenAI: `sk-...`)
- Check `.env` files are in the package directories
- Restart the services after adding keys
- Check logs for key validation messages

### "Invalid LLM response structure"
- LLM returned invalid JSON
- Check LLM response in logs
- May need to adjust prompt if this persists

### "Invalid placeholder value"
- LLM still returning placeholders
- Check prompt configuration
- May need to provide more examples to the LLM

## Files Modified

- `packages/planner-agent/src/workflows/PlanningGraph.ts` - Removed keyword fallback
- `packages/executor-agent/src/workflows/ExecutionGraph.ts` - Enhanced logging
- `packages/shared/src/services/LLMService.ts` - Enhanced validation
- `packages/shared/src/services/LLMResponseParser.ts` - Placeholder validation
- `packages/shared/src/prompts/planning.ts` - Enhanced prompts
- Created `.env` files in all package directories
