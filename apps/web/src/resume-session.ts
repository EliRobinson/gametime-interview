import type { ResumeSessionResult } from '@repo/api-contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type ResumeFailure = {
  ok: false;
  /** tRPC code string, or `UNREACHABLE` when the request never landed. */
  code: string;
  headline: string;
  detail: string;
};

export type ResumeResult = ({ ok: true } & ResumeSessionResult) | ResumeFailure;

type TrpcResponseBody = {
  result?: { data?: ResumeSessionResult };
  error?: { message?: string; data?: { code?: string } };
};

const FAILURES: Record<string, { headline: string; detail: string }> = {
  NOT_FOUND: {
    headline: "We couldn't find that checkout",
    detail: 'This checkout link is no longer valid. Start again from the listing.',
  },
  TIMEOUT: {
    headline: 'This checkout is no longer available',
    detail: 'The session expired before it could be resumed. Nothing was charged.',
  },
  UNPROCESSABLE_CONTENT: {
    headline: 'This checkout is no longer available',
    detail: 'These tickets were released while the checkout was idle. Nothing was charged.',
  },
  UNREACHABLE: {
    headline: "We couldn't reach checkout",
    detail: 'The checkout service is unavailable right now. Nothing was charged.',
  },
};

const GENERIC = {
  headline: 'Something went wrong',
  detail: 'We could not load this checkout. Nothing was charged.',
};

/**
 * Resumes a checkout session over the API's plain (non-batched, no transformer)
 * tRPC HTTP shape. Never throws: a bad session id must render a readable page,
 * not a 500.
 */
export async function resumeSession(sessionId: string): Promise<ResumeResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/trpc/checkout.resume`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, surface: 'web' }),
      cache: 'no-store',
    });
  } catch {
    return failure('UNREACHABLE');
  }

  let body: TrpcResponseBody;
  try {
    body = (await response.json()) as TrpcResponseBody;
  } catch {
    return failure('UNREACHABLE');
  }

  const data = body.result?.data;
  if (response.ok && data?.session) {
    return { ok: true, session: data.session, livePriceCents: data.livePriceCents ?? null };
  }

  return failure(body.error?.data?.code ?? 'INTERNAL_SERVER_ERROR');
}

function failure(code: string): ResumeFailure {
  const copy = FAILURES[code] ?? GENERIC;
  return { ok: false, code, headline: copy.headline, detail: copy.detail };
}
