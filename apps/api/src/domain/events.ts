export type CheckoutEventName =
  | 'session_created'
  | 'session_resumed'
  | 'price_reconfirmed'
  | 'session_expired'
  | 'session_completed'
  | 'session_failed';

export type Surface = 'web' | 'mobile';

export interface CheckoutEvent {
  name: CheckoutEventName;
  sessionId: string;
  timestamp: string;
  surface?: Surface;
  fromSurface?: Surface;
  toSurface?: Surface;
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
