import { SessionExpirySweeper } from './session-expiry-sweeper';

describe('SessionExpirySweeper', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes expireLapsedSessions on each interval tick', async () => {
    jest.useFakeTimers();
    const expireLapsedSessions = jest.fn().mockResolvedValue(2);
    const onSwept = jest.fn();
    const sweeper = new SessionExpirySweeper(
      { expireLapsedSessions },
      { intervalMs: 1000, onSwept },
    );

    sweeper.start();
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);
    sweeper.stop();

    expect(expireLapsedSessions).toHaveBeenCalledTimes(2);
    expect(onSwept).toHaveBeenCalledWith(2);
  });

  it('reports errors without throwing out of tick', async () => {
    const expireLapsedSessions = jest.fn().mockRejectedValue(new Error('store down'));
    const onError = jest.fn();
    const sweeper = new SessionExpirySweeper({ expireLapsedSessions }, { onError });

    await expect(sweeper.tick()).resolves.toBe(0);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('skips overlapping ticks while a sweep is in flight', async () => {
    let resolveSweep!: (count: number) => void;
    const expireLapsedSessions = jest.fn(
      () =>
        new Promise<number>((resolve) => {
          resolveSweep = resolve;
        }),
    );
    const sweeper = new SessionExpirySweeper({ expireLapsedSessions });

    const first = sweeper.tick();
    const second = sweeper.tick();
    resolveSweep(1);

    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(0);
    expect(expireLapsedSessions).toHaveBeenCalledTimes(1);
  });
});
