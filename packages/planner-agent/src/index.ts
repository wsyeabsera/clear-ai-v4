import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import express from 'express';
import cors from 'cors';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers';
import { connectDatabase, ToolRegistry } from '@clear-ai/shared';

const PORT = process.env.PORT_PLANNER || 4001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clear-ai';

async function startServer() {
  // Connect to MongoDB
  await connectDatabase(MONGODB_URI);

  // Initialize ToolRegistry from MCP server
  console.log('🔧 Initializing ToolRegistry...');
  const registry = ToolRegistry.getInstance();
  try {
    await registry.ensureInitialized();
    const toolCount = registry.getToolCount();
    console.log(`✓ ToolRegistry initialized with ${toolCount} tools`);
  } catch (error) {
    console.error('⚠️  Failed to initialize ToolRegistry:', error);
    console.log('⚠️  Continuing without tools...');
  }

  // Create Apollo Server with subgraph schema for federation
  const schema = buildSubgraphSchema([
    {
      typeDefs,
      resolvers,
    },
  ]);

  const server = new ApolloServer({
    schema,
  });

  await server.start();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server));

  app.listen(PORT, () => {
    console.log(`🚀 Planner Agent Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
