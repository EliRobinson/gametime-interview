import type { CheckoutSession, CheckoutSurface, SessionExpiryReason } from '@repo/api-contracts';
import { nanoid } from 'nanoid';

import type { EventLog } from './events';
import type { InventoryProvider } from './inventory-provider';
import { ListingAlreadyHeldError } from './inventory-provider';
import type { PaymentProvider } from './payment-provider';
import type { SessionStore } from './session-store';

// How long a checkout session stays resumable after creation: 10 minutes.
const SESSION_TTL_MS = 10 * 60 * 1000;

export class SessionNotFoundError extends Error {
  constructor(id: string) {
    super(`Session not found: ${id}`);
  }
}
export class SessionExpiredError extends Error {
  constructor(id: string) {
    super(`Session expired: ${id}`);
  }
}
export class ListingUnavailableError extends Error {
  constructor(id: string) {
    super(`Listing no longer held for session: ${id}`);
  }
}
export class PriceChangedError extends Error {
  constructor(id: string) {
    super(`Price changed and must be reconfirmed for session: ${id}`);
  }
}
export class ConflictError extends Error {
  constructor(id: string) {
    super(`Session already being completed on another surface: ${id}`);
  }
}

export class CheckoutService {
  constructor(
    private readonly store: SessionStore,
    private readonly inventory: InventoryProvider,
    private readonly payment: PaymentProvider,
    private readonly events: EventLog,
  ) {}

  async createSession(listingId: string): Promise<CheckoutSession> {
    let price: number;
    try {
      ({ price } = await this.inventory.placeHold(listingId));
    } catch (error) {
      // Hold exclusivity and unknown ids both surface as "listing unavailable"
      // so the landing Continue path can stay on the selection screen.
      if (
        error instanceof ListingAlreadyHeldError ||
        (error instanceof Error && /Unknown listing/.test(error.message))
      ) {
        throw new ListingUnavailableError(listingId);
      }
      throw error;
    }
    const now = new Date();
    const session: CheckoutSession = {
      id: nanoid(),
      listingId,
      status: 'active',
      priceAtCreation: price,
      acknowledgedPrice: price,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      failureReason: null,
    };
    this.store.create(session);
    this.events.emit({ name: 'session_created', sessionId: session.id });
    return session;
  }

  async resumeSession(id: string, surface: CheckoutSurface): Promise<CheckoutSession> {
    // Session expiration and the inventory hold are two independent clocks: a
    // session can be unexpired but reference inventory that is no longer held,
    // so resume checks the hold live rather than trusting `expiresAt`.
    let session = await this.expireIfNeeded(this.mustGet(id));
    if (!this.isTerminal(session)) {
      const holdStatus = await this.inventory.getHoldStatus(session.listingId);
      if (!holdStatus.held) session = this.expireNow(session, 'hold_released');
    }
    this.events.emit({ name: 'session_resumed', sessionId: id, toSurface: surface });
    return session;
  }

  async confirmPrice(id: string): Promise<CheckoutSession> {
    const session = await this.expireIfNeeded(this.mustGet(id));
    if (session.status === 'expired') throw new SessionExpiredError(id);
    // Nothing left to acknowledge on a finished order, and repricing one would
    // rewrite what the fan already paid.
    if (session.status === 'completed') return session;
    if (session.status === 'pending_payment') throw new ConflictError(id);

    const holdStatus = await this.inventory.getHoldStatus(session.listingId);
    const updated = this.store.casUpdate(id, session.status, (session) => ({
      ...session,
      acknowledgedPrice: holdStatus.currentPrice,
    }));
    if (!updated) throw new ConflictError(id);
    this.events.emit({ name: 'price_reconfirmed', sessionId: id });
    return updated;
  }

  async completeSession(id: string, surface: CheckoutSurface): Promise<CheckoutSession> {
    const session = await this.expireIfNeeded(this.mustGet(id));
    if (session.status === 'expired') throw new SessionExpiredError(id);
    if (session.status === 'completed') return session;
    // Another surface has already claimed this session and is mid-charge. The
    // CAS below cannot catch this on its own: expected and actual status would
    // both be `pending_payment`, so the swap would succeed and charge a second
    // time. This is the duplicate-order window, so reject it explicitly.
    if (session.status === 'pending_payment') throw new ConflictError(id);

    const holdStatus = await this.inventory.getHoldStatus(session.listingId);
    if (!holdStatus.held) {
      this.expireNow(session, 'hold_released');
      throw new ListingUnavailableError(id);
    }
    if (holdStatus.currentPrice !== session.acknowledgedPrice) {
      throw new PriceChangedError(id);
    }

    // Claim the session before charging. Whichever surface wins this swap owns
    // the payment attempt; the loser gets a ConflictError instead of a
    // duplicate order.
    const claimed = this.store.casUpdate(id, session.status, (session) => ({
      ...session,
      status: 'pending_payment',
    }));
    if (!claimed) throw new ConflictError(id);

    const outcome = await this.payment.charge(id, holdStatus.currentPrice);
    if (outcome === 'succeeded') {
      const completed = this.store.casUpdate(id, 'pending_payment', (session) => ({
        ...session,
        status: 'completed',
      }));
      this.events.emit({ name: 'session_completed', sessionId: id, surface });
      return completed as CheckoutSession;
    }

    const failed = this.store.casUpdate(id, 'pending_payment', (session) => ({
      ...session,
      status: 'failed',
      failureReason: outcome,
    }));
    this.events.emit({ name: 'session_failed', sessionId: id, surface });
    return failed as CheckoutSession;
  }

  /**
   * Fan abandoned checkout (e.g. mobile back). Drop the inventory hold so the
   * listing is selectable again, and expire the session as hold_released.
   */
  async releaseSession(id: string, surface: CheckoutSurface): Promise<CheckoutSession> {
    const session = this.mustGet(id);
    // Sold inventory stays unavailable; never unwind a finished order.
    if (session.status === 'completed') return session;
    // Mid-charge on another surface — releasing would race the payment claim.
    if (session.status === 'pending_payment') throw new ConflictError(id);

    await this.inventory.releaseHold(session.listingId);

    if (session.status === 'expired') return session;

    const expired = this.expireNow(session, 'hold_released');
    this.events.emit({ name: 'session_released', sessionId: id, surface });
    return expired;
  }

  private mustGet(id: string): CheckoutSession {
    const session = this.store.get(id);
    if (!session) throw new SessionNotFoundError(id);
    return session;
  }

  private isTerminal(session: CheckoutSession): boolean {
    return session.status === 'completed' || session.status === 'expired';
  }

  private async expireIfNeeded(session: CheckoutSession): Promise<CheckoutSession> {
    if (this.isTerminal(session)) return session;
    if (new Date(session.expiresAt).getTime() >= Date.now()) return session;
    return this.expireNow(session, 'session_lapsed');
  }

  private expireNow(session: CheckoutSession, reason: SessionExpiryReason): CheckoutSession {
    const expired = this.store.casUpdate(session.id, session.status, (session) => ({
      ...session,
      status: 'expired',
      expiryReason: reason,
    }));
    if (expired) this.events.emit({ name: 'session_expired', sessionId: session.id });
    return expired ?? session;
  }
}
