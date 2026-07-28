import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from 'api';

import { getBaseUrl } from './trpc';

// A vanilla (non-React-Query) client for screens that drive checkout
// imperatively — resume on mount, then complete/confirm in response to a tap.
// The React-Query flavoured client in `./trpc` stays the right tool for
// declarative reads; this one avoids wrapping one-shot recovery actions in
// mutation hooks. Both share `getBaseUrl()` so there is a single definition of
// where the API lives.
// AppRouter is type-only — do not value-import from `api` or Metro will pull
// server code (Prisma/Fastify) into the app bundle.
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
    }),
  ],
});
