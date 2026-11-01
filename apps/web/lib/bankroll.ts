// Pure bankroll / staking logic for the local Bankroll tool. No I/O: the UI persists state in
// localStorage only, and nothing here (or there) is sent to a server.

export type Risk = 'conservador' | 'moderado' | 'agresivo';
export type Result = 'pendiente' | 'ganada' | 'perdida' | 'nula';
export type Entry = { id: string; label: string; units: number; odds: number; result: Result; at: string };
export type BankrollState = { bankroll: number; unitPct: number; risk: Risk; entries: Entry[] };

export const RISK: Record<Risk, { label: string; kelly: number; note: string }> = {
  conservador: { label: 'Conservador', kelly: 0.25, note: '¼ Kelly' },
  moderado: { label: 'Moderado', kelly: 0.5, note: '½ Kelly' },
  agresivo: { label: 'Agresivo', kelly: 1, note: 'Kelly completo' },
};

export const LIMITS = {
  bankroll: { min: 0, max: 1e9 },
  unitPct: { min: 0.5, max: 5 },
  prob: { min: 1, max: 99 },
  odds: { min: 1.01, max: 100 },
  units: { min: 0.1, max: 10 },
  label: 80,
  entries: 200,
  /** Hard cap per position as a share of bankroll, whatever the Kelly formula says. */
  maxStakePct: 0.05,
} as const;

export const DEFAULT_STATE: BankrollState = { bankroll: 5000, unitPct: 1, risk: 'conservador', entries: [] };
const RESULTS: readonly Result[] = ['pendiente', 'ganada', 'perdida', 'nula'];

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Parses user text ("1,5", " 2.10 ") into a number within [min, max]; null when not a valid number. */
export function parseNumber(text: string, min: number, max: number): number | null {
  const t = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/**
 * Full Kelly fraction f* = (b·p − q) / b with b = odds − 1 and q = 1 − p.
 * Returns null for invalid inputs; values ≤ 0 mean there is no edge.
 */
export function kellyFraction(probability: number, decimalOdds: number): number | null {
  if (!isNum(probability) || !isNum(decimalOdds) || probability <= 0 || probability >= 1 || decimalOdds <= 1) return null;
  const b = decimalOdds - 1;
  return (b * probability - (1 - probability)) / b;
}

export type StakeAdvice = { kelly: number | null; fraction: number; stake: number; capped: boolean; reason: 'ok' | 'no_edge' | 'invalid' | 'no_bankroll' };

export function stakeAdvice(input: { bankroll: number; probability: number; odds: number; risk: Risk }): StakeAdvice {
  const kelly = kellyFraction(input.probability, input.odds);
  if (kelly == null) return { kelly: null, fraction: 0, stake: 0, capped: false, reason: 'invalid' };
  if (kelly <= 0) return { kelly, fraction: 0, stake: 0, capped: false, reason: 'no_edge' };
  const scaled = kelly * RISK[input.risk].kelly;
  const fraction = Math.min(scaled, LIMITS.maxStakePct);
  const capped = scaled > LIMITS.maxStakePct;
  if (!isNum(input.bankroll) || input.bankroll <= 0) return { kelly, fraction, stake: 0, capped, reason: 'no_bankroll' };
  return { kelly, fraction, stake: input.bankroll * fraction, capped, reason: 'ok' };
}

export const unitValue = (s: Pick<BankrollState, 'bankroll' | 'unitPct'>) => (s.bankroll * s.unitPct) / 100;

function sanitizeEntry(v: unknown): Entry | null {
  if (!v || typeof v !== 'object') return null;
  const e = v as Record<string, unknown>;
  if (typeof e.label !== 'string' || !e.label.trim() || !isNum(e.units) || !isNum(e.odds)) return null;
  if (e.units < LIMITS.units.min || e.units > LIMITS.units.max || e.odds < LIMITS.odds.min || e.odds > LIMITS.odds.max) return null;
  const result = RESULTS.includes(e.result as Result) ? (e.result as Result) : 'pendiente';
  const at = typeof e.at === 'string' && !Number.isNaN(Date.parse(e.at)) ? e.at : new Date(0).toISOString();
  const id = typeof e.id === 'string' && e.id ? e.id.slice(0, 64) : `restored-${Math.random().toString(36).slice(2, 10)}`;
  return { id, label: e.label.trim().slice(0, LIMITS.label), units: e.units, odds: e.odds, result, at };
}

/** Restores persisted state defensively: bad JSON or bad fields fall back to defaults; bad entries are dropped. */
export function parseState(raw: string | null): BankrollState {
  if (!raw) return { ...DEFAULT_STATE, entries: [] };
  let s: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_STATE, entries: [] };
    s = parsed as Record<string, unknown>;
  } catch {
    return { ...DEFAULT_STATE, entries: [] };
  }
  const bankroll = isNum(s.bankroll) ? clamp(s.bankroll, LIMITS.bankroll.min, LIMITS.bankroll.max) : DEFAULT_STATE.bankroll;
  const unitPct = isNum(s.unitPct) ? clamp(s.unitPct, LIMITS.unitPct.min, LIMITS.unitPct.max) : DEFAULT_STATE.unitPct;
  const risk = typeof s.risk === 'string' && s.risk in RISK ? (s.risk as Risk) : DEFAULT_STATE.risk;
  const ids = new Set<string>();
  const entries = (Array.isArray(s.entries) ? s.entries : [])
    .map(sanitizeEntry)
    .filter((e): e is Entry => e !== null && !ids.has(e.id) && Boolean(ids.add(e.id)))
    .slice(0, LIMITS.entries);
  return { bankroll, unitPct, risk, entries };
}

export function makeEntry(input: { label: string; units: number; odds: number }, now = new Date(), rand = Math.random): Entry | null {
  const label = input.label.trim().slice(0, LIMITS.label);
  if (!label || !isNum(input.units) || !isNum(input.odds)) return null;
  if (input.units < LIMITS.units.min || input.units > LIMITS.units.max || input.odds < LIMITS.odds.min || input.odds > LIMITS.odds.max) return null;
  return { id: `${now.getTime().toString(36)}-${rand().toString(36).slice(2, 8)}`, label, units: input.units, odds: input.odds, result: 'pendiente', at: now.toISOString() };
}

/** Newest first, capped so local storage cannot grow without bound. */
export const addEntry = (entries: Entry[], e: Entry) => [e, ...entries].slice(0, LIMITS.entries);

export type Summary = { settled: number; won: number; lost: number; voided: number; pending: number; staked: number; pl: number; roi: number | null; hitRate: number | null; pendingUnits: number };

/**
 * Units are the canonical record. Void ("nula") returns the stake, so it counts neither as staked
 * nor as a win/loss. ROI = profit / units staked on settled (won or lost) positions.
 */
export function summarize(entries: Entry[]): Summary {
  let won = 0, lost = 0, voided = 0, pending = 0, staked = 0, pl = 0, pendingUnits = 0;
  for (const e of entries) {
    if (e.result === 'ganada') { won++; staked += e.units; pl += e.units * (e.odds - 1); }
    else if (e.result === 'perdida') { lost++; staked += e.units; pl -= e.units; }
    else if (e.result === 'nula') voided++;
    else { pending++; pendingUnits += e.units; }
  }
  const settled = won + lost;
  return { settled, won, lost, voided, pending, staked, pl, roi: staked > 0 ? pl / staked : null, hitRate: settled > 0 ? won / settled : null, pendingUnits };
}

/** Share of bankroll currently tied up in pending positions, valued at the current unit size (0–1). */
export function exposure(s: Pick<BankrollState, 'bankroll' | 'unitPct'>, pendingUnits: number): number {
  if (!isNum(s.bankroll) || s.bankroll <= 0) return 0;
  return clamp((pendingUnits * unitValue(s)) / s.bankroll, 0, 1);
}
