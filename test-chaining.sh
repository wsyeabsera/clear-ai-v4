#!/bin/bash

echo "🧪 Testing Tool Chaining System"
echo "==============================="

# Test 1: Simple chaining (author → blog)
echo -e "\n1. Creating plan with author → blog chain..."
PLAN_RESPONSE=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createPlanWithRequestId(query: \"Create author Alice, then create blog by Alice\") { requestId planId toolOrder } }"}')

REQUEST_ID=$(echo $PLAN_RESPONSE | jq -r '.data.createPlanWithRequestId.requestId')
echo "   Request ID: $REQUEST_ID"

# Test 2: Execute the plan
echo -e "\n2. Executing plan..."
EXEC_RESPONSE=$(curl -s -X POST http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { executeByRequestId(requestId: \\\"$REQUEST_ID\\\") { successful failed outputs } }\"}")

echo $EXEC_RESPONSE | jq .

# Test 3: Complex chaining (author → blog → comment)
echo -e "\n3. Testing complex chain (author → blog → comment)..."
curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createPlanWithRequestId(query: \"Create author Bob, create blog by Bob, add comment to blog\") { toolOrder selectedTools { toolName dependsOn } } }"}' | jq .

echo -e "\n✅ Tests complete!"
