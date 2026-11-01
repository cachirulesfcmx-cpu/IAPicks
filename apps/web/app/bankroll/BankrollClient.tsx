'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Scale, Trash2 } from 'lucide-react';

type Risk = 'conservador' | 'moderado' | 'agresivo';
type Result = 'pendiente' | 'ganada' | 'perdida' | 'nula';
type Entry = { id: string; label: string; units: number; odds: number; result: Result; at: string };
type State = { bankroll: number; unitPct: number; risk: Risk; entries: Entry[] };

const KEY = 'iapicks.bankroll.v1';
const RISK: Record<Risk, { label: string; kelly: number; note: string }> = {
  conservador: { label: 'Conservador', kelly: 0.25, note: '¼ Kelly' },
  moderado: { label: 'Moderado', kelly: 0.5, note: '½ Kelly' },
  agresivo: { label: 'Agresivo', kelly: 1, note: 'Kelly completo' },
};
const MAX_STAKE_PCT = 0.05; // hard cap per position, whatever the formula says
const DEFAULT: State = { bankroll: 5000, unitPct: 1, risk: 'conservador', entries: [] };
const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

function load(): State {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const s = JSON.parse(raw) as Partial<State>;
    return {
      bankroll: clamp(Number(s.bankroll), 0, 1e9), unitPct: clamp(Number(s.unitPct), 0.5, 5),
      risk: s.risk && s.risk in RISK ? s.risk : 'conservador',
      entries: Array.isArray(s.entries) ? s.entries.slice(0, 200) : [],
    };
  } catch {
    return DEFAULT;
  }
}

export default function BankrollClient() {
  // Rendered client-only (see BankrollLoader), so reading localStorage in the initializer is safe.
  const [s, setS] = useState<State>(load);
  const [prob, setProb] = useState(55);
  const [odds, setOdds] = useState(2.0);
  const [form, setForm] = useState({ label: '', units: 1, odds: 1.9 });

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable: keep in memory */ }
  }, [s]);

  const unit = (s.bankroll * s.unitPct) / 100;
  const kelly = useMemo(() => {
    const p = prob / 100;
    const b = odds - 1;
    return b > 0 ? (b * p - (1 - p)) / b : -1;
  }, [prob, odds]);
  const fraction = kelly > 0 ? Math.min(kelly * RISK[s.risk].kelly, MAX_STAKE_PCT) : 0;
  const stake = s.bankroll * fraction;
  const capped = kelly > 0 && kelly * RISK[s.risk].kelly > MAX_STAKE_PCT;

  const stats = useMemo(() => {
    const settled = s.entries.filter((e) => e.result === 'ganada' || e.result === 'perdida');
    const staked = settled.reduce((a, e) => a + e.units, 0);
    const pl = settled.reduce((a, e) => a + (e.result === 'ganada' ? e.units * (e.odds - 1) : -e.units), 0);
    const won = settled.filter((e) => e.result === 'ganada').length;
    const pendingUnits = s.entries.filter((e) => e.result === 'pendiente').reduce((a, e) => a + e.units, 0);
    return { settled: settled.length, won, lost: settled.length - won, pl, roi: staked ? pl / staked : null, pendingUnits };
  }, [s.entries]);

  const exposure = s.bankroll > 0 ? Math.min(1, (stats.pendingUnits * unit) / s.bankroll) : 0;

  function add() {
    const label = form.label.trim().slice(0, 80);
    if (!label || form.units <= 0 || form.odds <= 1) return;
    const e: Entry = { id: `${Date.now()}`, label, units: clamp(form.units, 0.1, 10), odds: clamp(form.odds, 1.01, 100), result: 'pendiente', at: new Date().toISOString() };
    setS({ ...s, entries: [e, ...s.entries] });
    setForm({ label: '', units: 1, odds: 1.9 });
  }
  const setResult = (id: string, result: Result) => setS({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, result } : e)) });
  const remove = (id: string) => setS({ ...s, entries: s.entries.filter((e) => e.id !== id) });

  return (
    <div className="stack">
      <section className="bank-hero">
        <div className="bank-top">
          <span className="kicker">Tu bankroll</span>
          <span className="badge badge-demo">Herramienta local · sin dinero real</span>
        </div>
        <label className="bank-amount">
          <span className="sr-only">Bankroll en pesos</span>
          <span className="currency">$</span>
          <input inputMode="decimal" type="number" min={0} step={100} value={s.bankroll} onChange={(e) => setS({ ...s, bankroll: clamp(Number(e.target.value), 0, 1e9) })} />
          <span className="cur-code">MXN</span>
        </label>
        <div className="exposure">
          <div className="exposure-head"><span>Exposición pendiente</span><span>{money(stats.pendingUnits * unit)} ({(exposure * 100).toFixed(1)} %)</span></div>
          <span className="bar"><span className={`bar-fill ${exposure > 0.15 ? 'bar-warn' : ''}`} style={{ width: `${exposure * 100}%` }} /></span>
        </div>
        <div className="bank-row">
          <label className="field">
            <span>Tamaño de unidad: {s.unitPct}% · {money(unit)}</span>
            <input type="range" min={0.5} max={5} step={0.5} value={s.unitPct} onChange={(e) => setS({ ...s, unitPct: Number(e.target.value) })} />
          </label>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Nivel de riesgo">
          {(Object.keys(RISK) as Risk[]).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={s.risk === r} className={`seg ${s.risk === r ? 'seg-on' : ''}`} onClick={() => setS({ ...s, risk: r })}>
              <strong>{RISK[r].label}</strong><small>{RISK[r].note}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="detail-grid">
        <section className="panel" aria-labelledby="h-calc">
          <div className="section-header"><div><p className="kicker">Gestión de stake</p><h2 id="h-calc">Calculadora Kelly</h2></div><Scale size={20} aria-hidden className="muted" /></div>
          <p className="muted small">Introduce tu propia estimación. IA Picks no publica probabilidades sin un modelo aprobado.</p>
          <div className="calc-grid">
            <label className="field"><span>Tu probabilidad (%)</span><input type="number" min={1} max={99} value={prob} onChange={(e) => setProb(clamp(Number(e.target.value), 1, 99))} /></label>
            <label className="field"><span>Cuota decimal</span><input type="number" min={1.01} step={0.01} value={odds} onChange={(e) => setOdds(clamp(Number(e.target.value), 1.01, 100))} /></label>
          </div>
          <div className="calc-out">
            <div><span>Kelly completo</span><strong>{kelly > 0 ? `${(kelly * 100).toFixed(1)} %` : '—'}</strong></div>
            <div><span>Stake sugerido · {RISK[s.risk].note}</span><strong className={stake > 0 ? 'tone-pos' : 'tone-muted'}>{stake > 0 ? money(stake) : 'No apostar'}</strong></div>
            <div><span>En unidades</span><strong>{stake > 0 && unit > 0 ? `${(stake / unit).toFixed(2)} u` : '—'}</strong></div>
          </div>
          {kelly <= 0 ? <p className="calc-note">Sin ventaja: con esta probabilidad y cuota, el valor esperado es negativo.</p> : null}
          {capped ? <p className="calc-note">Limitado al {MAX_STAKE_PCT * 100} % del bankroll por posición.</p> : null}
        </section>

        <section className="panel" aria-labelledby="h-perf">
          <div className="section-header"><div><p className="kicker">Tu registro</p><h2 id="h-perf">Rendimiento</h2></div></div>
          <div className="stat-grid stat-grid-3">
            <div className="stat-tile"><span className="stat-label">Resultado</span><span className={`stat-value ${stats.pl > 0 ? 'tone-pos' : stats.pl < 0 ? 'tone-neg' : 'tone-muted'}`}>{stats.settled ? `${stats.pl >= 0 ? '+' : ''}${stats.pl.toFixed(2)} u` : '—'}</span><span className="stat-sub">{stats.settled ? money(stats.pl * unit) : 'sin registros'}</span></div>
            <div className="stat-tile"><span className="stat-label">ROI</span><span className="stat-value">{stats.roi != null ? `${(stats.roi * 100).toFixed(1)} %` : '—'}</span><span className="stat-sub">{stats.settled} liquidadas</span></div>
            <div className="stat-tile"><span className="stat-label">G / P</span><span className="stat-value">{stats.won} / {stats.lost}</span><span className="stat-sub">{stats.settled ? `${Math.round((stats.won / stats.settled) * 100)} % acierto` : '—'}</span></div>
          </div>
          <p className="muted small">Calculado solo con tus registros, guardados únicamente en este dispositivo.</p>
        </section>
      </div>

      <section className="panel" aria-labelledby="h-log">
        <div className="section-header"><div><p className="kicker">Historial</p><h2 id="h-log">Registro de posiciones</h2></div></div>
        <form className="log-form" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <label className="field grow"><span>Descripción</span><input maxLength={80} placeholder="Ej. Local gana · Liga MX" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
          <label className="field"><span>Unidades</span><input type="number" min={0.1} max={10} step={0.1} value={form.units} onChange={(e) => setForm({ ...form, units: Number(e.target.value) })} /></label>
          <label className="field"><span>Cuota</span><input type="number" min={1.01} step={0.01} value={form.odds} onChange={(e) => setForm({ ...form, odds: Number(e.target.value) })} /></label>
          <button type="submit" className="btn" disabled={!form.label.trim()}><Plus size={18} aria-hidden />Añadir</button>
        </form>
        {s.entries.length === 0 ? (
          <div className="empty" role="status"><h3>Aún no hay registros</h3><p>Anota posiciones para seguir tu disciplina de stake. Nada se envía a ningún servidor.</p></div>
        ) : (
          <ul className="log-list">
            {s.entries.map((e) => (
              <li key={e.id}>
                <div className="log-main"><strong>{e.label}</strong><small>{e.units} u · cuota {e.odds.toFixed(2)} · {money(e.units * unit)}</small></div>
                <select aria-label={`Resultado de ${e.label}`} value={e.result} onChange={(ev) => setResult(e.id, ev.target.value as Result)} className={`result result-${e.result}`}>
                  <option value="pendiente">Pendiente</option><option value="ganada">Ganada</option><option value="perdida">Perdida</option><option value="nula">Nula</option>
                </select>
                <button type="button" className="icon-btn" aria-label={`Eliminar ${e.label}`} onClick={() => remove(e.id)}><Trash2 size={18} aria-hidden /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
