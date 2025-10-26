# Quick Start

Get up and running with your first multi-tool execution in 5 minutes.

## Prerequisites

- All services running (see [Installation](installation))
- Valid API keys configured
- MongoDB connected

## Example: Create Author and Blog

Let's create an author and then create a blog by that author in a single chained operation.

### Step 1: Create a Plan

Send a natural language query to the Planner Agent:

```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      createPlanWithRequestId(query: \"Create author Bob with email bob@example.com, then create blog by Bob titled My First Blog about getting started\") {
        requestId
        planId
        toolOrder
        selectedTools {
          toolName
          parameters
          dependsOn
        }
      }
    }"
  }'
```

**Expected Response:**

```json
{
  "data": {
    "createPlanWithRequestId": {
      "requestId": "req_1234567890_abc123",
      "planId": "plan_1234567890_def456",
      "toolOrder": ["createAuthor", "createBlog"],
      "selectedTools": [
        {
          "toolName": "createAuthor",
          "parameters": "{\"name\":\"Bob\",\"email\":\"bob@example.com\"}",
          "dependsOn": null
        },
        {
          "toolName": "createBlog",
          "parameters": "{\"authorId\":\"{{createAuthor._id}}\",\"title\":\"My First Blog\",\"content\":\"about getting started\"}",
          "dependsOn": "createAuthor"
        }
      ]
    }
  }
}
```

**What Happened:**

1. The **LLM analyzed** your natural language query
2. It **selected** the `createAuthor` and `createBlog` tools
3. It **extracted** parameters (name, email, title, content)
4. It **identified dependencies** (blog depends on author)
5. It **created template references** (`{{createAuthor._id}}`) for chaining

### Step 2: Execute the Plan

Use the `requestId` from Step 1 to execute:

```bash
REQUEST_ID="req_1234567890_abc123"

curl -X POST http://localhost:4002/graphql \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation { executeByRequestId(requestId: \\\"$REQUEST_ID\\\") { successful failed errors outputs } }\"
  }"
```

**Expected Response:**

```json
{
  "data": {
    "executeByRequestId": {
      "successful": 2,
      "failed": 0,
      "errors": [],
      "outputs": "{\"createAuthor\":{\"_id\":\"...\",\"name\":\"Bob\",\"email\":\"bob@example.com\"},\"createBlog\":{\"_id\":\"...\",\"title\":\"My First Blog\",\"authorId\":\"...\"}}"
    }
  }
}
```

**What Happened:**

1. The **Executor Agent** fetched the plan from MongoDB
2. It **executed tools sequentially** in dependency order
3. It **resolved templates** (`{{createAuthor._id}}` → actual author ID)
4. It **passed outputs** from one tool to the next
5. It **returned results** with success/failure counts

### Step 3: Verify Results

Check the database to see what was created:

```bash
# Check author
mongosh clear-ai-blog --quiet --eval "db.authors.find({name: 'Bob'}).pretty()"

# Check blog
mongosh clear-ai-blog --quiet --eval "db.blogs.find({title: 'My First Blog'}).pretty()"
```

You should see:
- Author with name "Bob" and email "bob@example.com"
- Blog with title "My First Blog" linked to the author

## Understanding the Flow

```
┌─────────────────────────────────────────────────────┐
│ User Query                                          │
│ "Create author Bob, then create blog by Bob..."     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  1. Planner Agent          │
        │  - LLM analyzes query      │
        │  - Selects tools           │
        │  - Extracts parameters     │
        │  - Creates plan            │
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │  2. Store in MongoDB        │
        │  - requestId: req_...       │
        │  - planId: plan_...         │
        │  - selectedTools: [...]    │
        │  - toolOrder: [...]        │
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │  3. Executor Agent         │
        │  - Fetches plan            │
        │  - Resolves templates      │
        │  - Executes sequentially   │
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │  4. MCP Server             │
        │  - Executes createAuthor   │
        │  - Executes createBlog     │
        └─────────────┬──────────────┘
                      │
                      ▼
        ┌────────────────────────────┐
        │  5. MongoDB                │
        │  - Saves author            │
        │  - Saves blog              │
        │  - Updates plan results    │
        └────────────────────────────┘
```

## More Examples

### Example 2: Create Multiple Authors

```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      createPlanWithRequestId(query: \"Create authors Alice with email alice@test.com and Bob with email bob@test.com, then create blog by Alice titled Hello World about programming\") {
        requestId
        toolOrder
      }
    }"
  }'
```

### Example 3: Complex Chaining

```bash
curl -X POST http://localhost:4001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation {
      createPlanWithRequestId(query: \"Create author Charlie, create blog by Charlie, then create comment on that blog by Charlie saying Great post!\") {
        requestId
        planId
        toolOrder
        selectedTools {
          toolName
          dependsOn
        }
      }
    }"
  }'
```

This chains: Author → Blog → Comment

## GraphQL Playground

For interactive testing, use the GraphQL Playground:

1. Open http://localhost:4001/graphql in your browser
2. Use the built-in query editor
3. Test mutations and queries interactively

## Next Steps

- Learn about [Tool Chaining](tutorials/first-plan)
- Explore the [API Reference](api-reference/planner-agent)
- Understand [Parameter Resolution](advanced/parameter-resolution)

