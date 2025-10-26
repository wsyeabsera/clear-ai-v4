#!/bin/bash

echo "🧪 Complete System Test"
echo "======================"

# Clear database
mongosh clear-ai-blog --quiet --eval "db.authors.deleteMany({}); db.blogs.deleteMany({}); db.comments.deleteMany({})" > /dev/null 2>&1

# Test 1: Simple author + blog
echo -e "\n1️⃣  Testing: Create author and blog"
RESPONSE=$(curl -s -X POST http://localhost:4001/graphql -H "Content-Type: application/json" \
  -d '{"query":"mutation { createPlanWithRequestId(query: \"Create author Bob with email bob@test.com, then create blog by Bob about Docker\") { requestId planId toolOrder selectedTools { toolName dependsOn } } }"}')

REQUEST_ID=$(echo $RESPONSE | jq -r '.data.createPlanWithRequestId.requestId')
echo "   Request ID: $REQUEST_ID"
echo "   Tool Order: $(echo $RESPONSE | jq -r '.data.createPlanWithRequestId.toolOrder | join(", ")')"

# Execute
EXEC_RESULT=$(curl -s -X POST http://localhost:4002/graphql -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { executeByRequestId(requestId: \\\"$REQUEST_ID\\\") { successful failed errors } }\"}")

echo "   Result: Successful $(echo $EXEC_RESULT | jq -r '.data.executeByRequestId.successful'), Failed $(echo $EXEC_RESULT | jq -r '.data.executeByRequestId.failed')"

# Test 2: Author + Blog + Comment chain
echo -e "\n2️⃣  Testing: Author + Blog + Comment chain"
sleep 1
RESPONSE=$(curl -s -X POST http://localhost:4001/graphql -H "Content-Type: application/json" \
  -d '{"query":"mutation { createPlanWithRequestId(query: \"Create author Charlie, create blog by Charlie about Kubernetes, add comment to that blog\") { requestId planId toolOrder } }"}')

REQUEST_ID2=$(echo $RESPONSE | jq -r '.data.createPlanWithRequestId.requestId')
EXEC_RESULT=$(curl -s -X POST http://localhost:4002/graphql -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation { executeByRequestId(requestId: \\\"$REQUEST_ID2\\\") { successful failed errors } }\"}")

echo "   Result: Successful $(echo $EXEC_RESULT | jq -r '.data.executeByRequestId.successful'), Failed $(echo $EXEC_RESULT | jq -r '.data.executeByRequestId.failed')"

# Verify database
echo -e "\n✅ Database Status:"
echo "   Authors: $(mongosh clear-ai-blog --quiet --eval 'db.authors.countDocuments()')"
echo "   Blogs: $(mongosh clear-ai-blog --quiet --eval 'db.blogs.countDocuments()')"
echo "   Comments: $(mongosh clear-ai-blog --quiet --eval 'db.comments.countDocuments()')"

echo -e "\n✨ Tests complete!"
