'use client';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Scale, Trash2 } from 'lucide-react';
import {
  addEntry, exposure as exposureOf, LIMITS, makeEntry, parseNumber, parseState, RISK, stakeAdvice, summarize, unitValue,
  type BankrollState, type Result, type Risk,
} from '@/lib/bankroll';

const KEY = 'iapicks.bankroll.v1';
const money = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

function load(): BankrollState {
  try { return parseState(window.localStorage.getItem(KEY)); } catch { return parseState(null); }
}

/** Text-backed numeric field: keeps what the user types and reports a parsed value (or null) upward. */
function NumberField({ label, value, onValue, min, max, error }: {
  label: string; value: string; onValue: (text: string) => void; min: number; max: number; error?: string | null;
}) {
  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>{label}</span>
      <input inputMode="decimal" type="text" value={value} onChange={(e) => onValue(e.target.value)} aria-invalid={Boolean(error)}
        placeholder={`${min}–${max}`} />
      {error ? <small className="field-msg" role="alert">{error}</small> : null}
    </label>
  );
}

export default function BankrollClient() {
  // Rendered client-only (see BankrollLoader), so reading localStorage in the initializer is safe.
  const [s, setS] = useState<BankrollState>(load);
  const [bankText, setBankText] = useState(() => String(s.bankroll));
  const [probText, setProbText] = useState('55');
  const [oddsText, setOddsText] = useState('2.00');
  const [form, setForm] = useState({ label: '', units: '1', odds: '1.90' });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable: keep in memory only */ }
  }, [s]);

  const prob = parseNumber(probText, LIMITS.prob.min, LIMITS.prob.max);
  const odds = parseNumber(oddsText, LIMITS.odds.min, LIMITS.odds.max);
  const unit = unitValue(s);
  const advice = stakeAdvice({ bankroll: s.bankroll, probability: (prob ?? NaN) / 100, odds: odds ?? NaN, risk: s.risk });
  const stats = useMemo(() => summarize(s.entries), [s.entries]);
  const exposure = exposureOf(s, stats.pendingUnits);

  function onBankroll(text: string) {
    setBankText(text);
    const n = parseNumber(text, LIMITS.bankroll.min, LIMITS.bankroll.max);
    if (n != null) setS((prev) => ({ ...prev, bankroll: n }));
  }

  function add() {
    const units = parseNumber(form.units, LIMITS.units.min, LIMITS.units.max);
    const o = parseNumber(form.odds, LIMITS.odds.min, LIMITS.odds.max);
    if (!form.label.trim()) return setFormError('Escribe una descripción.');
    if (units == null) return setFormError(`Unidades entre ${LIMITS.units.min} y ${LIMITS.units.max}.`);
    if (o == null) return setFormError(`Cuota decimal entre ${LIMITS.odds.min} y ${LIMITS.odds.max}.`);
    const e = makeEntry({ label: form.label, units, odds: o });
    if (!e) return setFormError('Revisa los datos.');
    setS((prev) => ({ ...prev, entries: addEntry(prev.entries, e) }));
    setForm({ label: '', units: '1', odds: '1.90' });
    setFormError(null);
  }
  const setResult = (id: string, result: Result) => setS((prev) => ({ ...prev, entries: prev.entries.map((e) => (e.id === id ? { ...e, result } : e)) }));
  const remove = (id: string) => setS((prev) => ({ ...prev, entries: prev.entries.filter((e) => e.id !== id) }));

  const bankError = parseNumber(bankText, LIMITS.bankroll.min, LIMITS.bankroll.max) == null ? 'Introduce un importe válido.' : null;
  const stakeLabel = advice.reason === 'ok' ? money(advice.stake)
    : advice.reason === 'no_edge' ? 'No apostar'
      : advice.reason === 'no_bankroll' ? 'Define tu bankroll' : '—';

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
          <input inputMode="decimal" type="text" value={bankText} onChange={(e) => onBankroll(e.target.value)} aria-invalid={Boolean(bankError)} />
          <span className="cur-code">MXN</span>
        </label>
        {bankError ? <small className="field-msg" role="alert">{bankError}</small> : null}
        <div className="exposure">
          <div className="exposure-head"><span>Exposición pendiente</span><span>{money(stats.pendingUnits * unit)} ({(exposure * 100).toFixed(1)} %)</span></div>
          <span className="bar"><span className={`bar-fill ${exposure > 0.15 ? 'bar-warn' : ''}`} style={{ width: `${exposure * 100}%` }} /></span>
        </div>
        <div className="bank-row">
          <label className="field">
            <span>Tamaño de unidad: {s.unitPct}% · {money(unit)}</span>
            <input type="range" min={LIMITS.unitPct.min} max={LIMITS.unitPct.max} step={0.5} value={s.unitPct}
              onChange={(e) => setS((prev) => ({ ...prev, unitPct: Number(e.target.value) }))} />
          </label>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Nivel de riesgo">
          {(Object.keys(RISK) as Risk[]).map((r) => (
            <button key={r} type="button" role="radio" aria-checked={s.risk === r} className={`seg ${s.risk === r ? 'seg-on' : ''}`} onClick={() => setS((prev) => ({ ...prev, risk: r }))}>
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
            <NumberField label="Tu probabilidad (%)" value={probText} onValue={setProbText} min={LIMITS.prob.min} max={LIMITS.prob.max}
              error={prob == null ? `Entre ${LIMITS.prob.min} y ${LIMITS.prob.max}` : null} />
            <NumberField label="Cuota decimal" value={oddsText} onValue={setOddsText} min={LIMITS.odds.min} max={LIMITS.odds.max}
              error={odds == null ? `Entre ${LIMITS.odds.min} y ${LIMITS.odds.max}` : null} />
          </div>
          <div className="calc-out">
            <div><span>Kelly completo</span><strong>{advice.kelly != null && advice.kelly > 0 ? `${(advice.kelly * 100).toFixed(1)} %` : '—'}</strong></div>
            <div><span>Stake sugerido · {RISK[s.risk].note}</span><strong className={advice.reason === 'ok' ? 'tone-pos' : 'tone-muted'}>{stakeLabel}</strong></div>
            <div><span>En unidades</span><strong>{advice.reason === 'ok' && unit > 0 ? `${(advice.stake / unit).toFixed(2)} u` : '—'}</strong></div>
          </div>
          {advice.reason === 'no_edge' ? <p className="calc-note">Sin ventaja: con esta probabilidad y cuota, el valor esperado es negativo o nulo.</p> : null}
          {advice.capped ? <p className="calc-note">Limitado al {LIMITS.maxStakePct * 100} % del bankroll por posición.</p> : null}
        </section>

        <section className="panel" aria-labelledby="h-perf">
          <div className="section-header"><div><p className="kicker">Tu registro</p><h2 id="h-perf">Rendimiento</h2></div></div>
          <div className="stat-grid stat-grid-3">
            <div className="stat-tile"><span className="stat-label">Resultado</span><span className={`stat-value ${stats.pl > 0 ? 'tone-pos' : stats.pl < 0 ? 'tone-neg' : 'tone-muted'}`}>{stats.settled ? `${stats.pl >= 0 ? '+' : ''}${stats.pl.toFixed(2)} u` : '—'}</span><span className="stat-sub">{stats.settled ? money(stats.pl * unit) : 'sin registros'}</span></div>
            <div className="stat-tile"><span className="stat-label">ROI</span><span className="stat-value">{stats.roi != null ? `${(stats.roi * 100).toFixed(1)} %` : '—'}</span><span className="stat-sub">{stats.settled} liquidadas{stats.voided ? ` · ${stats.voided} nulas` : ''}</span></div>
            <div className="stat-tile"><span className="stat-label">G / P</span><span className="stat-value">{stats.won} / {stats.lost}</span><span className="stat-sub">{stats.hitRate != null ? `${Math.round(stats.hitRate * 100)} % acierto` : '—'}</span></div>
          </div>
          <p className="muted small">Solo con tus registros, guardados únicamente en este dispositivo. Los importes en pesos usan el tamaño de unidad actual.</p>
        </section>
      </div>

      <section className="panel" aria-labelledby="h-log">
        <div className="section-header"><div><p className="kicker">Historial</p><h2 id="h-log">Registro de posiciones</h2></div><span className="muted small">{s.entries.length}/{LIMITS.entries}</span></div>
        <form className="log-form" onSubmit={(e) => { e.preventDefault(); add(); }} noValidate>
          <label className="field grow"><span>Descripción</span><input maxLength={LIMITS.label} placeholder="Ej. Local gana · Liga MX" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label>
          <NumberField label="Unidades" value={form.units} onValue={(t) => setForm({ ...form, units: t })} min={LIMITS.units.min} max={LIMITS.units.max} />
          <NumberField label="Cuota" value={form.odds} onValue={(t) => setForm({ ...form, odds: t })} min={LIMITS.odds.min} max={LIMITS.odds.max} />
          <button type="submit" className="btn" disabled={!form.label.trim()}><Plus size={18} aria-hidden />Añadir</button>
          {formError ? <p className="field-msg log-error" role="alert">{formError}</p> : null}
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
