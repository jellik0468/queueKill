import { createServer } from 'http';
import { createApp } from './app';
import { config, validateEnv } from './config';
import { initializeSocket } from './sockets';
import prisma from './lib/prisma';

/**
 * Start the server
 */
async function main(): Promise<void> {
  // Validate environment variables
  validateEnv();

  // Create Express app
  const app = createApp();

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO
  initializeSocket(httpServer);

  // Connect to database
  try {
    await prisma.$connect();
    console.info('✅ Connected to database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  // Start server
  httpServer.listen(config.port, config.host, () => {
    console.info(`
🚀 Server is running!
   
   Environment: ${config.nodeEnv}
   URL: http://${config.host}:${config.port}
   API: http://${config.host}:${config.port}/api
   Health: http://${config.host}:${config.port}/api/health
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.info(`\n${signal} received. Shutting down gracefully...`);

    httpServer.close(() => {
      console.info('HTTP server closed');
    });

    await prisma.$disconnect();
    console.info('Database connection closed');

    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

