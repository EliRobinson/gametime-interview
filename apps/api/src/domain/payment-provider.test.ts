import { FakePaymentProvider } from './payment-provider';

describe('FakePaymentProvider', () => {
  it('defaults to succeeded', async () => {
    const payment = new FakePaymentProvider();
    await expect(payment.charge('sess_1', 4200)).resolves.toBe('succeeded');
  });

  it('returns a forced outcome for a given session', async () => {
    const payment = new FakePaymentProvider();
    payment.forceOutcome('sess_1', 'declined');
    await expect(payment.charge('sess_1', 4200)).resolves.toBe('declined');
  });
});
