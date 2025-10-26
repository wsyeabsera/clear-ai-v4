#!/bin/bash

set -e

echo "🧪 Starting End-to-End Test"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Cleaning up processes...${NC}"
  kill $MCP_PID 2>/dev/null || true
  kill $PLANNER_PID 2>/dev/null || true
  kill $EXECUTOR_PID 2>/dev/null || true
  wait $MCP_PID $PLANNER_PID $EXECUTOR_PID 2>/dev/null || true
}

trap cleanup EXIT

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
  echo -e "${RED}❌ MongoDB is not running. Please start MongoDB first.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ MongoDB is running${NC}"

# Start MCP Server
echo -e "\n${YELLOW}Starting MCP Server...${NC}"
yarn workspace @clear-ai/mcp-server start &
MCP_PID=$!
sleep 3
echo -e "${GREEN}✓ MCP Server started (PID: $MCP_PID)${NC}"

# Start Planner Agent
echo -e "\n${YELLOW}Starting Planner Agent...${NC}"
(cd packages/planner-agent && yarn dev) &
PLANNER_PID=$!
sleep 3
echo -e "${GREEN}✓ Planner Agent started (PID: $PLANNER_PID)${NC}"

# Start Executor Agent
echo -e "\n${YELLOW}Starting Executor Agent...${NC}"
(cd packages/executor-agent && yarn dev) &
EXECUTOR_PID=$!
sleep 3
echo -e "${GREEN}✓ Executor Agent started (PID: $EXECUTOR_PID)${NC}"

# Wait a bit for everything to initialize
echo -e "\n${YELLOW}Waiting for services to initialize...${NC}"
sleep 5

# Test 1: Check if tools are available
echo -e "\n${YELLOW}Test 1: Checking available tools...${NC}"
TOOLS_RESPONSE=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ getAvailableTools { name description category } }"}')

if echo "$TOOLS_RESPONSE" | grep -q "createBlog"; then
  echo -e "${GREEN}✓ Tools are available${NC}"
else
  echo -e "${RED}❌ Tools not found in response${NC}"
  echo "$TOOLS_RESPONSE"
  exit 1
fi

# Test 2: Create a plan
echo -e "\n${YELLOW}Test 2: Creating a plan for 'Create a blog post about TypeScript'...${NC}"
PLAN_RESPONSE=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createPlanWithWorkflow(query: \"Create a blog post about TypeScript\") { id query plan selectedTools { name } validationResult } }"}')

if echo "$PLAN_RESPONSE" | grep -q "createBlog"; then
  echo -e "${GREEN}✓ Plan created with tools selected${NC}"
  echo "$PLAN_RESPONSE"
else
  echo -e "${RED}❌ Failed to create plan${NC}"
  echo "$PLAN_RESPONSE"
  exit 1
fi

echo -e "\n${GREEN}================================"
echo -e "✅ All tests passed!${NC}"
echo -e "================================"
