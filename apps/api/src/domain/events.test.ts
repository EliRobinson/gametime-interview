import { EventLog } from './events';

describe('EventLog', () => {
  it('records an emitted event with a timestamp', () => {
    const log = new EventLog();
    log.emit({ name: 'session_created', sessionId: 'sess_1' });

    const [event] = log.all();
    expect(event).toMatchObject({ name: 'session_created', sessionId: 'sess_1' });
    expect(typeof event?.timestamp).toBe('string');
  });

  it('all() returns a snapshot, not a live reference', () => {
    const log = new EventLog();
    log.emit({ name: 'session_created', sessionId: 'sess_1' });
    const snapshot = log.all();
    log.emit({ name: 'session_completed', sessionId: 'sess_1' });

    expect(snapshot).toHaveLength(1);
  });
});
