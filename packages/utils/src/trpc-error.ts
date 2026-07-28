/**
 * A `TRPCClientError` carries its wire code at `error.data.code`. Read it
 * structurally instead of importing the class so callers stay pure over the
 * response shape.
 */
export function trpcErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return null;
  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}
