/**
 * @jest-environment node
 *
 * Pre-hydration evidence.
 *
 * `GET /checkout/:id` must return meaningful HTML before any client JS runs.
 * These tests await the server component and render the resulting tree with
 * `renderToStaticMarkup` — i.e. exactly what a browser with JS disabled sees.
 */
import type { CheckoutSession } from '@repo/api-contracts';
import { renderToStaticMarkup } from 'react-dom/server';

import CheckoutPage from './page';

jest.mock('../../../src/trpc-client', () => ({
  trpc: {
    checkout: {
      complete: { mutate: jest.fn() },
      confirmPrice: { mutate: jest.fn() },
      resume: { mutate: jest.fn() },
      release: { mutate: jest.fn() },
    },
  },
}));

const session: CheckoutSession = {
  id: 'sess_ssr',
  listingId: 'listing_7',
  status: 'active',
  priceAtCreation: 4200,
  acknowledgedPrice: 4200,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:10:00.000Z',
  failureReason: null,
};

function stubFetch(status: number, body: unknown): jest.Mock {
  const mock = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

async function renderPage(id: string): Promise<string> {
  const element = await CheckoutPage({ params: { id } });
  return renderToStaticMarkup(element);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkout page server render', () => {
  it('puts the listing, status and price in the HTML before hydration', async () => {
    const fetchMock = stubFetch(200, {
      result: { data: { session, livePriceCents: session.acknowledgedPrice } },
    });

    const html = await renderPage('sess_ssr');

    expect(html).toContain('listing_7');
    expect(html).toContain('$42.00');
    expect(html).toMatch(/Active/i);
    // No loading placeholder is ever emitted on the server.
    expect(html).not.toMatch(/loading/i);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/trpc/checkout.resume');
    expect(init.cache).toBe('no-store');
    expect(JSON.parse(String(init.body))).toEqual({ sessionId: 'sess_ssr', surface: 'web' });
  });

  it('renders fixture-driven Super Deal when the listing has one', async () => {
    stubFetch(200, {
      result: {
        data: {
          session: { ...session, listingId: 'listing_1', acknowledgedPrice: 15400 },
          livePriceCents: 15400,
        },
      },
    });

    const html = await renderPage('sess_ssr');

    expect(html).toContain('You found a Super Deal!');
    expect(html).toContain('$154.00');
    expect(html).toContain('$308.00');
    expect(html).toContain('Ed Sheeran');
    expect(html).toContain('Upper 309, Row JJ');
    expect(html).toContain('maps.gametime.co/v2/centurylink_field/edsheeran/edsheeran-8.png');
    expect(html).toContain('width=768');
    expect(html).toContain('1280w');
  });

  it('renders an expired session in its terminal state without client JS', async () => {
    stubFetch(200, {
      result: {
        data: {
          session: { ...session, status: 'expired', expiryReason: 'session_lapsed' },
          livePriceCents: null,
        },
      },
    });

    const html = await renderPage('sess_ssr');

    expect(html).toMatch(/checkout session expired/i);
    expect(html).not.toMatch(/CONTINUE/i);
  });

  it('renders a released inventory hold distinctly from a lapsed session', async () => {
    stubFetch(200, {
      result: {
        data: {
          session: { ...session, status: 'expired', expiryReason: 'hold_released' },
          livePriceCents: null,
        },
      },
    });

    const html = await renderPage('sess_ssr');

    expect(html).toMatch(/listing no longer available/i);
    expect(html).not.toMatch(/checkout session expired/i);
  });

  it('renders a readable not-found state instead of throwing on an unknown id', async () => {
    stubFetch(404, {
      error: { message: 'Session not found: nope', data: { code: 'NOT_FOUND', httpStatus: 404 } },
    });

    const html = await renderPage('nope');

    expect(html).toMatch(/find that checkout/i);
  });

  it('renders a listing-unavailable state for UNPROCESSABLE_CONTENT', async () => {
    stubFetch(422, {
      error: { message: 'gone', data: { code: 'UNPROCESSABLE_CONTENT', httpStatus: 422 } },
    });

    const html = await renderPage('sess_ssr');

    expect(html).toMatch(/no longer available/i);
  });

  it('renders a readable state when the API is unreachable', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;

    const html = await renderPage('sess_ssr');

    expect(html).toMatch(/reach checkout/i);
  });
});
