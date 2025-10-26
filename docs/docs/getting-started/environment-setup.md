# Environment Setup

Detailed guide for configuring environment variables and managing different deployment scenarios.

## Environment Variables Reference

### Required Variables

#### MongoDB Configuration

```env
MONGODB_URI=mongodb://localhost:27017/clear-ai-blog
```

- **Format**: Standard MongoDB connection string
- **Default**: `mongodb://localhost:27017/clear-ai-blog`
- **Production**: Use MongoDB Atlas or dedicated server

#### LLM Provider (Choose One or Both)

**Groq (Recommended for Free Tier):**

```env
GROQ_API_KEY=gsk_your_api_key_here
```

- **Format**: Must start with `gsk_`
- **Provider**: https://console.groq.com
- **Cost**: Free tier available
- **Model**: `llama-3.1-8b-instant` (default)

**OpenAI:**

```env
OPENAI_API_KEY=sk-your_api_key_here
```

- **Format**: Must start with `sk-`
- **Provider**: https://platform.openai.com
- **Cost**: Pay per use
- **Model**: `gpt-4o-mini` (default)

### Optional Variables

#### LLM Configuration

```env
# Choose LLM model (based on provider)
LLM_MODEL=llama-3.1-8b-instant    # Groq models
# LLM_MODEL=gpt-4o-mini           # OpenAI models
# LLM_MODEL=gpt-4                 # OpenAI models (more powerful)

# Temperature (0.0 = deterministic, 1.0 = creative)
LLM_TEMPERATURE=0.7

# Maximum tokens in response
LLM_MAX_TOKENS=2000
```

#### Port Configuration

```env
# Planner Agent
PORT_PLANNER=4001

# Executor Agent
PORT_EXECUTOR=4002

# Gateway
PORT_GATEWAY=4000

# MCP Server (gRPC)
MCP_SERVER_PORT=50051
```

#### Database Name

```env
# MongoDB database name
DB_NAME=clear-ai-blog
```

## Setting Up for Different Environments

### Development Environment

Create `.env` file in project root:

```env
MONGODB_URI=mongodb://localhost:27017/clear-ai-blog
GROQ_API_KEY=gsk_your_key_here
LLM_MODEL=llama-3.1-8b-instant
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000
PORT_PLANNER=4001
PORT_EXECUTOR=4002
PORT_GATEWAY=4000
MCP_SERVER_PORT=50051
```

Copy to all packages:

```bash
cp .env packages/planner-agent/.env
cp .env packages/executor-agent/.env
cp .env packages/shared/.env
cp .env packages/mcp-server/.env
```

### Production Environment

For production, use environment-specific configuration:

```env
MONGODB_URI=mongodb://user:pass@production-server:27017/clear-ai-blog
OPENAI_API_KEY=sk-prod-key-here
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=4000
PORT_PLANNER=4001
PORT_EXECUTOR=4002
PORT_GATEWAY=4000
MCP_SERVER_PORT=50051
```

### Testing Environment

Use separate database:

```env
MONGODB_URI=mongodb://localhost:27017/clear-ai-blog-test
GROQ_API_KEY=gsk_test_key_here
LLM_MODEL=llama-3.1-8b-instant
LLM_TEMPERATURE=0.5
```

## API Key Management

### Getting a Groq API Key

1. Visit https://console.groq.com
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Copy the key (format: `gsk_...`)
6. Add to `.env` file

**Free Tier Limits:**
- 14,400 requests/day
- Fast response times
- Models: llama-3.1-8b-instant, mixtral-8x7b-32768

### Getting an OpenAI API Key

1. Visit https://platform.openai.com
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create new secret key"
5. Copy the key (format: `sk-...`)
6. Add to `.env` file

**OpenAI Pricing:**
- GPT-4o-mini: $0.15 / 1M input tokens, $0.60 / 1M output tokens
- GPT-4: $2.50 / 1M input tokens, $10 / 1M output tokens

### Validating API Keys

Test your API keys:

```bash
# Test Groq
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

Both should return a list of available models.

## MongoDB Setup

### Local MongoDB

**macOS:**

```bash
# Install
brew tap mongodb/brew
brew install mongodb-community

# Start
brew services start mongodb-community

# Check status
brew services list
```

**Linux (Ubuntu):**

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start
sudo systemctl start mongod
```

### Docker MongoDB

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    container_name: clear-ai-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: clear-ai-blog
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

Start with:

```bash
docker-compose up -d
```

### MongoDB Atlas (Cloud)

1. Sign up at https://cloud.mongodb.com
2. Create a new cluster
3. Create database user
4. Get connection string
5. Update `.env`:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/clear-ai-blog
```

## Troubleshooting

### "No valid API keys found"

**Error:**
```
Error: No valid API keys found. Please set GROQ_API_KEY or OPENAI_API_KEY
```

**Solution:**
1. Verify `.env` file exists in all packages
2. Check key format (Groq: `gsk_...`, OpenAI: `sk-...`)
3. Restart services after adding keys

```bash
# Kill all services
./kill-ports.sh

# Restart
yarn dev
```

### "Connection ECONNREFUSED 127.0.0.1:27017"

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**

1. Check if MongoDB is running:
   ```bash
   brew services list | grep mongodb
   ```

2. Start MongoDB:
   ```bash
   brew services start mongodb-community
   ```

3. Verify connection:
   ```bash
   mongosh
   ```

### "Port already in use"

**Error:**
```
Error: listen EADDRINUSE: address already in use :4001
```

**Solution:**

Kill the process using the port:

```bash
# macOS/Linux
lsof -ti:4001 | xargs kill -9

# Or use the project script
./kill-ports.sh
```

### "LLM response structure invalid"

**Error:**
```
Error: Invalid LLM response structure
```

**Solution:**

1. Check LLM provider is accessible:
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer $GROQ_API_KEY"
   ```

2. Verify model name is correct:
   - Groq: `llama-3.1-8b-instant`, `mixtral-8x7b-32768`
   - OpenAI: `gpt-4o-mini`, `gpt-4`

3. Check API rate limits

## Environment-Specific Tips

### Development

- Use Groq for free tier
- Enable detailed logging
- Use local MongoDB
- Relax LLM temperature for variety

### Staging

- Use production-like configuration
- Monitor API usage
- Set stricter validation
- Use shared MongoDB instance

### Production

- Use OpenAI for reliability
- Implement caching
- Monitor error rates
- Use managed MongoDB (Atlas)
- Set up alerts
- Implement rate limiting

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** - Not hardcoded keys
3. **Rotate keys regularly** - Especially in production
4. **Limit API permissions** - Use least privilege
5. **Monitor usage** - Track API consumption
6. **Use separate keys** - Different keys per environment

## Next Steps

- Learn about [Tool Chaining](core-concepts/tool-chaining)
- Explore [LLM Integration](core-concepts/llm-integration)
- Read the [Quick Start Guide](quick-start)

