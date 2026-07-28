export type PaymentOutcome = 'succeeded' | 'declined' | 'timeout';

export interface PaymentProvider {
  charge(sessionId: string, amount: number): Promise<PaymentOutcome>;
}

export class FakePaymentProvider implements PaymentProvider {
  private forcedOutcomes = new Map<string, PaymentOutcome>();

  forceOutcome(sessionId: string, outcome: PaymentOutcome): void {
    this.forcedOutcomes.set(sessionId, outcome);
  }

  async charge(sessionId: string, _amount: number): Promise<PaymentOutcome> {
    return this.forcedOutcomes.get(sessionId) ?? 'succeeded';
  }
}
