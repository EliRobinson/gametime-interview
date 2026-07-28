import { createTRPCClient, httpBatchLink } from '@trpc/client';
// Type-only: value-importing from `api` would drag Fastify and Prisma into the
// browser bundle.
import type { AppRouter } from 'api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${API_URL}/trpc` })],
});
