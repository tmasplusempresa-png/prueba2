import { trackingGapMs } from '../utils/trackingWatchdog';

describe('trackingGapMs', () => {
  const now = 1_000_000;

  it('sin ningún punto cuenta desde que se empezó a vigilar', () => {
    expect(trackingGapMs(null, now - 90_000, now)).toBe(90_000);
    expect(trackingGapMs(undefined, now - 5_000, now)).toBe(5_000);
  });

  it('un valor ilegible se trata como sin puntos', () => {
    expect(trackingGapMs('no-json', now - 70_000, now)).toBe(70_000);
    expect(trackingGapMs('{"time":"x"}', now - 70_000, now)).toBe(70_000);
  });

  it('con puntos usa el último, salvo que la vigilancia sea más reciente', () => {
    const raw = JSON.stringify({ lat: 1, lng: 2, time: now - 30_000 });
    expect(trackingGapMs(raw, now - 600_000, now)).toBe(30_000);
    expect(trackingGapMs(raw, now - 10_000, now)).toBe(10_000);
  });
});
