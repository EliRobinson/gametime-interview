import type { CheckoutSession } from '@repo/api-contracts';

export interface SessionStore {
  create(session: CheckoutSession): void;
  get(id: string): CheckoutSession | undefined;
  /** Full scan for the in-memory prototype; production would filter by expiresAt. */
  list(): CheckoutSession[];
  casUpdate(
    id: string,
    expectedStatus: CheckoutSession['status'],
    updater: (session: CheckoutSession) => CheckoutSession,
  ): CheckoutSession | undefined;
}

export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, CheckoutSession>();

  create(session: CheckoutSession): void {
    this.sessions.set(session.id, session);
  }

  get(id: string): CheckoutSession | undefined {
    return this.sessions.get(id);
  }

  list(): CheckoutSession[] {
    return [...this.sessions.values()];
  }

  // Compare-and-swap: the status check and the write happen with no `await`
  // between them, so two same-tick callers cannot both win the swap. This is
  // what prevents duplicate order completion across surfaces.
  casUpdate(
    id: string,
    expectedStatus: CheckoutSession['status'],
    updater: (session: CheckoutSession) => CheckoutSession,
  ): CheckoutSession | undefined {
    const current = this.sessions.get(id);
    if (!current || current.status !== expectedStatus) return undefined;
    const updated = updater(current);
    this.sessions.set(id, updated);
    return updated;
  }
}
