import type { CheckoutSurface } from '@repo/api-contracts';

export type CheckoutEventName =
  | 'session_created'
  | 'session_resumed'
  | 'price_reconfirmed'
  | 'session_expired'
  | 'session_released'
  | 'session_completed'
  | 'session_failed';

export interface CheckoutEvent {
  name: CheckoutEventName;
  sessionId: string;
  timestamp: string;
  surface?: CheckoutSurface;
  fromSurface?: CheckoutSurface;
  toSurface?: CheckoutSurface;
}

export class EventLog {
  private events: CheckoutEvent[] = [];

  emit(event: Omit<CheckoutEvent, 'timestamp'>): void {
    this.events.push({ ...event, timestamp: new Date().toISOString() });
  }

  all(): CheckoutEvent[] {
    return [...this.events];
  }
}
