#!/bin/bash

echo "🧪 Quick End-to-End Test"
echo "========================"

echo ""
echo "1. Testing MCP Server..."
MCP_TOOLS=$(curl -s -X POST http://localhost:50051 -H "Content-Type: application/json" 2>&1 || echo "MCP server not accessible via HTTP")
echo "   MCP Server Status: $(lsof -i :50051 | wc -l) connections"

echo ""
echo "2. Testing Planner Agent..."
PLANNER_RESPONSE=$(curl -s http://localhost:4001/graphql -X POST -H "Content-Type: application/json" -d '{"query":"{ getAvailableTools { name category } }"}')
TOOL_COUNT=$(echo "$PLANNER_RESPONSE" | jq '.data.getAvailableTools | length' 2>/dev/null || echo "0")
echo "   Planner returned $TOOL_COUNT tools"

if [ "$TOOL_COUNT" -gt "0" ]; then
    echo "   ✓ Planner is working!"
    echo "   Sample tools:"
    echo "$PLANNER_RESPONSE" | jq '.data.getAvailableTools[0:3]' 2>/dev/null
else
    echo "   ⚠️  No tools found"
fi

echo ""
echo "3. Creating a test plan..."
PLAN_RESPONSE=$(curl -s http://localhost:4001/graphql -X POST -H "Content-Type: application/json" -d '{"query":"mutation { createPlanWithWorkflow(query: \"Create a blog post about TypeScript\") { id plan selectedTools { name } } }"}')
echo "$PLAN_RESPONSE" | jq '.' 2>/dev/null || echo "$PLAN_RESPONSE"

echo ""
echo "✅ Test complete!"
