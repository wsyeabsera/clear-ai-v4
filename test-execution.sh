#!/bin/bash

echo "🧪 Testing Tool Chaining Execution"
echo "==================================="

# Create plan
echo -e "\n1. Creating plan..."
PLAN_RESPONSE=$(curl -s -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createPlanWithRequestId(query: \"Create author Dave with email dave@example.com, then create blog about Go by Dave\") { requestId planId toolOrder selectedTools { toolName dependsOn parameters } } }"}')

echo $PLAN_RESPONSE | jq '.data.createPlanWithRequestId'

REQUEST_ID=$(echo $PLAN_RESPONSE | jq -r '.data.createPlanWithRequestId.requestId')
echo -e "\nRequest ID: $REQUEST_ID"

# Execute plan
echo -e "\n2. Executing plan..."
sleep 2
curl -s -X POST http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { executeByRequestId(requestId: \\\"$REQUEST_ID\\\") { requestId totalExecutions successful failed results outputs errors } }\"}" | jq .data.executeByRequestId

