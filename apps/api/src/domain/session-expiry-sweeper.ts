/** Default poll interval for the in-process session TTL sweeper. */
export const SESSION_EXPIRY_SWEEP_INTERVAL_MS = 30_000;

export type SessionExpirySweepTarget = {
  expireLapsedSessions: () => Promise<number>;
};

export type SessionExpirySweeperOptions = {
  intervalMs?: number;
  onError?: (error: unknown) => void;
  onSwept?: (count: number) => void;
};

/**
 * In-process timer that periodically asks checkout to expire lapsed sessions.
 * Single-process demo glue — production would use a real job runner / cron.
 */
export class SessionExpirySweeper {
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickInFlight = false;
  private readonly intervalMs: number;
  private readonly onError: ((error: unknown) => void) | undefined;
  private readonly onSwept: ((count: number) => void) | undefined;

  constructor(
    private readonly checkout: SessionExpirySweepTarget,
    options: SessionExpirySweeperOptions = {},
  ) {
    this.intervalMs = options.intervalMs ?? SESSION_EXPIRY_SWEEP_INTERVAL_MS;
    this.onError = options.onError;
    this.onSwept = options.onSwept;
  }

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  /** One sweep pass. Safe to call from tests without starting the timer. */
  async tick(): Promise<number> {
    if (this.tickInFlight) return 0;
    this.tickInFlight = true;
    try {
      const swept = await this.checkout.expireLapsedSessions();
      if (swept > 0) this.onSwept?.(swept);
      return swept;
    } catch (error) {
      this.onError?.(error);
      return 0;
    } finally {
      this.tickInFlight = false;
    }
  }
}
