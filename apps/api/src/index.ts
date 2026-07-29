import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import Fastify from 'fastify';

import { createContext, createSessionExpirySweeper } from './context';
import { env } from './env';
import { appRouter } from './router';

const server = Fastify({ logger: true });

async function main() {
  await server.register(cors, { origin: true });

  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter, createContext },
  });

  server.get('/health', async () => ({ ok: true }));

  await server.listen({ port: env.PORT, host: '0.0.0.0' });

  const sweeper = createSessionExpirySweeper({
    onError: (error) => {
      server.log.error(error, 'session expiry sweep failed');
    },
    onSwept: (count) => {
      server.log.info({ swept: count }, 'expired lapsed checkout sessions');
    },
  });
  sweeper.start();

  const shutdown = async () => {
    sweeper.stop();
    await server.close();
  };
  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
}

main().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
