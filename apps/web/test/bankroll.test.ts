import { describe, expect, it } from 'vitest';
import {
  addEntry, DEFAULT_STATE, exposure, kellyFraction, LIMITS, makeEntry, parseNumber, parseState, stakeAdvice, summarize, unitValue,
  type Entry,
} from '@/lib/bankroll';

const entry = (over: Partial<Entry>): Entry => ({ id: Math.random().toString(36), label: 'x', units: 1, odds: 2, result: 'pendiente', at: '2026-11-01T00:00:00.000Z', ...over });

describe('kellyFraction', () => {
  it('matches f* = (b·p − q) / b', () => {
    expect(kellyFraction(0.55, 2)).toBeCloseTo(0.1, 10);
    expect(kellyFraction(0.6, 1.9)).toBeCloseTo((0.9 * 0.6 - 0.4) / 0.9, 10);
  });
  it('is zero at fair odds and negative without edge', () => {
    expect(kellyFraction(0.5, 2)).toBeCloseTo(0, 10);
    expect(kellyFraction(0.4, 2)!).toBeLessThan(0);
  });
  it('rejects invalid inputs', () => {
    for (const [p, o] of [[0, 2], [1, 2], [-0.1, 2], [0.5, 1], [0.5, 0.5], [NaN, 2], [0.5, Infinity]] as const) {
      expect(kellyFraction(p, o)).toBeNull();
    }
  });
});

describe('stakeAdvice', () => {
  it('scales by risk profile', () => {
    const base = { bankroll: 10_000, probability: 0.52, odds: 2 }; // full Kelly 4 %
    expect(stakeAdvice({ ...base, risk: 'conservador' }).stake).toBeCloseTo(100, 6);
    expect(stakeAdvice({ ...base, risk: 'moderado' }).stake).toBeCloseTo(200, 6);
    expect(stakeAdvice({ ...base, risk: 'agresivo' }).stake).toBeCloseTo(400, 6);
  });
  it('never exceeds the hard cap per position', () => {
    const a = stakeAdvice({ bankroll: 10_000, probability: 0.9, odds: 3, risk: 'agresivo' });
    expect(a.capped).toBe(true);
    expect(a.fraction).toBe(LIMITS.maxStakePct);
    expect(a.stake).toBeCloseTo(500, 6);
  });
  it('says no edge instead of a stake', () => {
    expect(stakeAdvice({ bankroll: 10_000, probability: 0.45, odds: 2, risk: 'agresivo' })).toMatchObject({ stake: 0, reason: 'no_edge' });
    expect(stakeAdvice({ bankroll: 10_000, probability: 0.5, odds: 2, risk: 'agresivo' }).reason).toBe('no_edge');
  });
  it('distinguishes an empty bankroll and invalid input', () => {
    expect(stakeAdvice({ bankroll: 0, probability: 0.6, odds: 2, risk: 'moderado' })).toMatchObject({ stake: 0, reason: 'no_bankroll' });
    expect(stakeAdvice({ bankroll: 1000, probability: NaN, odds: 2, risk: 'moderado' }).reason).toBe('invalid');
  });
});

describe('parseNumber', () => {
  it('accepts decimals with point or comma within range', () => {
    expect(parseNumber('1.5', 1.01, 100)).toBe(1.5);
    expect(parseNumber(' 2,25 ', 1.01, 100)).toBe(2.25);
    expect(parseNumber('.5', 0.1, 10)).toBe(0.5);
  });
  it('rejects partial, out-of-range and non-numeric input without coercing', () => {
    for (const t of ['', '1.', '-2', '1e3', 'abc', '0', '101', '1.2.3', 'Infinity']) expect(parseNumber(t, 1.01, 100)).toBeNull();
  });
});

describe('parseState (localStorage restore)', () => {
  it('returns defaults for missing, corrupt or non-object data', () => {
    for (const raw of [null, '', '{', 'null', '[]', '42', '"x"']) expect(parseState(raw)).toEqual(DEFAULT_STATE);
  });
  it('falls back per field instead of zeroing values', () => {
    expect(parseState(JSON.stringify({ bankroll: 'mucho', unitPct: null, risk: 'yolo' }))).toEqual(DEFAULT_STATE);
    expect(parseState(JSON.stringify({ bankroll: 2500, unitPct: 2, risk: 'agresivo' }))).toMatchObject({ bankroll: 2500, unitPct: 2, risk: 'agresivo' });
  });
  it('clamps out-of-range numbers', () => {
    expect(parseState(JSON.stringify({ bankroll: -5, unitPct: 50 }))).toMatchObject({ bankroll: 0, unitPct: LIMITS.unitPct.max });
  });
  it('drops malformed entries and de-duplicates ids so rendering cannot crash', () => {
    const s = parseState(JSON.stringify({
      entries: [
        entry({ id: 'a' }),
        { id: 'b', label: 'sin números', units: '1', odds: '2' },
        { id: 'c', label: '', units: 1, odds: 2 },
        { id: 'd', label: 'cuota imposible', units: 1, odds: 0.5 },
        entry({ id: 'a', label: 'duplicado' }),
        entry({ id: 'e', result: 'trampa' as Entry['result'] }),
        'basura', null,
      ],
    }));
    expect(s.entries.map((e) => e.id)).toEqual(['a', 'e']);
    expect(s.entries[1]!.result).toBe('pendiente');
  });
  it('caps stored entries', () => {
    const many = Array.from({ length: LIMITS.entries + 50 }, (_, i) => entry({ id: `id${i}` }));
    expect(parseState(JSON.stringify({ entries: many })).entries).toHaveLength(LIMITS.entries);
  });
});

describe('entries', () => {
  it('validates new entries', () => {
    const now = new Date('2026-11-01T00:00:00Z');
    expect(makeEntry({ label: '  Local gana  ', units: 1.5, odds: 1.9 }, now, () => 0.5)).toMatchObject({ label: 'Local gana', units: 1.5, odds: 1.9, result: 'pendiente' });
    expect(makeEntry({ label: '', units: 1, odds: 2 })).toBeNull();
    expect(makeEntry({ label: 'x', units: 0, odds: 2 })).toBeNull();
    expect(makeEntry({ label: 'x', units: 1, odds: 1 })).toBeNull();
    expect(makeEntry({ label: 'x', units: NaN, odds: 2 })).toBeNull();
  });
  it('generates distinct ids within the same millisecond', () => {
    const now = new Date();
    const a = makeEntry({ label: 'x', units: 1, odds: 2 }, now)!;
    const b = makeEntry({ label: 'x', units: 1, odds: 2 }, now)!;
    expect(a.id).not.toBe(b.id);
  });
  it('keeps the newest entries when the cap is reached', () => {
    const full = Array.from({ length: LIMITS.entries }, (_, i) => entry({ id: `old${i}` }));
    const next = addEntry(full, entry({ id: 'new' }));
    expect(next).toHaveLength(LIMITS.entries);
    expect(next[0]!.id).toBe('new');
  });
});

describe('summarize (ROI, voids, pending)', () => {
  it('computes profit and ROI on settled units only', () => {
    const s = summarize([
      entry({ result: 'ganada', units: 2, odds: 2.5 }), // +3
      entry({ result: 'perdida', units: 1 }), // −1
      entry({ result: 'nula', units: 5 }), // stake returned
      entry({ result: 'pendiente', units: 3 }),
    ]);
    expect(s).toMatchObject({ settled: 2, won: 1, lost: 1, voided: 1, pending: 1, staked: 3, pendingUnits: 3 });
    expect(s.pl).toBeCloseTo(2, 10);
    expect(s.roi).toBeCloseTo(2 / 3, 10);
    expect(s.hitRate).toBe(0.5);
  });
  it('reports null ROI and hit rate with nothing settled', () => {
    const s = summarize([entry({ result: 'nula' }), entry({ result: 'pendiente' })]);
    expect(s.roi).toBeNull();
    expect(s.hitRate).toBeNull();
    expect(summarize([]).pl).toBe(0);
  });
});

describe('unit value and exposure', () => {
  it('follow bankroll and unit size changes', () => {
    expect(unitValue({ bankroll: 5000, unitPct: 1 })).toBe(50);
    expect(unitValue({ bankroll: 5000, unitPct: 2.5 })).toBe(125);
    expect(exposure({ bankroll: 5000, unitPct: 1 }, 10)).toBeCloseTo(0.1, 10);
    expect(exposure({ bankroll: 5000, unitPct: 2 }, 10)).toBeCloseTo(0.2, 10);
  });
  it('is bounded and safe with an empty bankroll', () => {
    expect(exposure({ bankroll: 0, unitPct: 1 }, 10)).toBe(0);
    expect(exposure({ bankroll: 100, unitPct: 5 }, 1000)).toBe(1);
  });
});
