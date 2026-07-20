import app from './app';
import { env } from './config/env';
import { prisma } from './config/db';

const server = app.listen(env.PORT, () => {
  console.log(`[SERVER] CampusFlow backend running on port ${env.PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`[SERVER] ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[SERVER] HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('[SERVER] Prisma disconnected.');
    } catch (err) {
      console.error('[SERVER] Error disconnecting Prisma:', err);
    }
    process.exit(0);
  });
  
  // Force shutdown after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('[SERVER] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});
