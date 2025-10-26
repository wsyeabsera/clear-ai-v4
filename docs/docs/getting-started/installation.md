# Installation

This guide will help you set up Clear AI V4 on your local machine.

## Prerequisites

- **Node.js**: Version 18 or higher
- **Yarn**: Package manager (install with `npm install -g yarn`)
- **MongoDB**: Version 5.0 or higher (running locally or via Docker)
- **API Keys**: Groq or OpenAI API key for LLM functionality

## Step 1: Clone the Repository

```bash
git clone https://github.com/clear-ai/clear-ai-v4.git
cd clear-ai-v4
```

## Step 2: Install Dependencies

Install all workspace dependencies:

```bash
yarn install
```

This will install dependencies for all packages in the monorepo.

## Step 3: Set Up MongoDB

### Option A: Using MongoDB Directly

Start MongoDB service:

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or run directly
mongod --dbpath /path/to/data
```

### Option B: Using Docker

```bash
docker run --name clear-ai-mongodb \
  -d -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=clear-ai-blog \
  mongo:latest
```

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/clear-ai-blog

# LLM Provider (choose one or both)
# Groq (free, fast)
GROQ_API_KEY=gsk_your_groq_api_key_here

# OpenAI (paid, powerful)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Optional: LLM Configuration
LLM_MODEL=llama-3.1-8b-instant  # For Groq
# LLM_MODEL=gpt-4o-mini          # For OpenAI
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000

# Ports (optional, these are defaults)
PORT_PLANNER=4001
PORT_EXECUTOR=4002
PORT_GATEWAY=4000
MCP_SERVER_PORT=50051
```

Copy `.env` to all package directories:

```bash
cp .env packages/planner-agent/.env
cp .env packages/executor-agent/.env
cp .env packages/shared/.env
cp .env packages/mcp-server/.env
```

## Step 5: Get API Keys

### Groq API Key (Recommended for Free Tier)

1. Visit https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `gsk_`)
6. Add to `.env` as `GROQ_API_KEY`

### OpenAI API Key

1. Visit https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-`)
6. Add to `.env` as `OPENAI_API_KEY`

## Step 6: Build the Project

Build all packages:

```bash
yarn build
```

This compiles TypeScript code for:
- `packages/shared`
- `packages/mcp-server`
- `packages/planner-agent`
- `packages/executor-agent`
- `packages/gateway`

## Step 7: Start the Services

### Option A: Start All Services (Recommended)

```bash
yarn dev
```

This starts all services concurrently:
- MCP Server (port 50051)
- Planner Agent (port 4001)
- Executor Agent (port 4002)
- Gateway (port 4000)

### Option B: Start Services Individually

```bash
# Terminal 1: MCP Server
yarn mcp-server:dev

# Terminal 2: Planner Agent
yarn planner:dev

# Terminal 3: Executor Agent
yarn executor:dev

# Terminal 4: Gateway (optional)
yarn gateway:dev
```

## Step 8: Verify Installation

Check that all services are running:

```bash
# Check Planner Agent
curl http://localhost:4001/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Check Executor Agent
curl http://localhost:4002/graphql -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

Both should return: `{"data":{"__typename":"Query"}}`

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**: Ensure MongoDB is running:
```bash
# Check MongoDB status
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community
```

### LLM API Key Error

```
Error: No valid API keys found. Please set GROQ_API_KEY or OPENAI_API_KEY
```

**Solution**: Verify your `.env` file has valid API keys:
```bash
# Check Groq key format
echo $GROQ_API_KEY  # Should start with 'gsk_'

# Check OpenAI key format
echo $OPENAI_API_KEY  # Should start with 'sk-'
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :4001
```

**Solution**: Kill the process using the port:
```bash
# macOS/Linux
lsof -ti:4001 | xargs kill -9

# Or use the project's kill script
./kill-ports.sh
```

### MCP Server Connection Error

```
Error: 14 UNAVAILABLE: No connection established
```

**Solution**: Ensure MCP Server starts before agents:
```bash
# Kill all services
pkill -f "node.*mcp-server"
pkill -f "nodemon.*planner-agent"
pkill -f "nodemon.*executor-agent"

# Restart in order
yarn mcp-server:dev  # Wait for it to start
yarn planner:dev
yarn executor:dev
```

## Next Steps

Once everything is running, try the [Quick Start Guide](quick-start) to create your first execution plan.

