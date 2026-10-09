import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';

function main(): void {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    logger.error('configuration_invalid', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }

  const app = createApp(env);
  const server = app.listen(env.PORT, () => {
    logger.info('server_started', { port: env.PORT, env: env.NODE_ENV });
  });

  const shutdown = (signal: string): void => {
    logger.info('server_shutdown', { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
