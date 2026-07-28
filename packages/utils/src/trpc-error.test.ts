import { trpcErrorCode } from './trpc-error';

describe('trpcErrorCode', () => {
  it.each([
    {
      name: 'reads data.code',
      error: Object.assign(new Error('nope'), { data: { code: 'NOT_FOUND' } }),
      expected: 'NOT_FOUND',
    },
    { name: 'null for non-objects', error: 'boom', expected: null },
    { name: 'null when data missing', error: new Error('boom'), expected: null },
    {
      name: 'null when code missing',
      error: Object.assign(new Error('boom'), { data: {} }),
      expected: null,
    },
  ])('$name', ({ error, expected }) => {
    expect(trpcErrorCode(error)).toBe(expected);
  });
});
