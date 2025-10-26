import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT_GATEWAY || 4000;
const PLANNER_SERVICE_URL = process.env.PLANNER_SERVICE_URL || 'http://localhost:4001';
const EXECUTOR_SERVICE_URL = process.env.EXECUTOR_SERVICE_URL || 'http://localhost:4002';

// Helper to check if service is available
async function waitForService(url: string, serviceName: string, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      if (response.ok) {
        console.log(`✅ ${serviceName} is ready at ${url}`);
        return true;
      }
    } catch (error) {
      // Service not ready yet
    }
    console.log(`⏳ Waiting for ${serviceName} to be ready... (${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

async function startGateway() {
  console.log('🚀 Starting Gateway...');
  console.log(`📡 Checking planner service at ${PLANNER_SERVICE_URL}/graphql`);
  console.log(`📡 Checking executor service at ${EXECUTOR_SERVICE_URL}/graphql`);

  // Wait for services to be ready
  const plannerReady = await waitForService(`${PLANNER_SERVICE_URL}/graphql`, 'Planner Agent');
  const executorReady = await waitForService(`${EXECUTOR_SERVICE_URL}/graphql`, 'Executor Agent');

  if (!plannerReady || !executorReady) {
    console.error('❌ Services not ready. Please start planner-agent and executor-agent first.');
    process.exit(1);
  }

  // Create gateway that composes schemas from subgraphs
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        { name: 'planner', url: `${PLANNER_SERVICE_URL}/graphql` },
        { name: 'executor', url: `${EXECUTOR_SERVICE_URL}/graphql` },
      ],
    }),
  });

  const server = new ApolloServer({
    gateway,
  });

  await server.start();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server));

  app.listen(PORT, () => {
    console.log(`\n🚀 Gateway Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📡 Connected to Planner Agent: ${PLANNER_SERVICE_URL}/graphql`);
    console.log(`📡 Connected to Executor Agent: ${EXECUTOR_SERVICE_URL}/graphql`);
  });
}

startGateway().catch((error) => {
  console.error('Failed to start gateway:', error);
  process.exit(1);
});
