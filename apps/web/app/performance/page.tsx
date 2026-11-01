import type { Metadata } from 'next';
import { ChartColumn, Database } from 'lucide-react';
import { SPORT_LABELS, SPORTS } from '@vanta-edge/shared';
import { EmptyState, Notice, PageHeader, SectionHeader, StatTile } from '@/components/ui';
import { SportGlyph } from '@/components/visual';
import { fmt, signed } from '@/lib/format';
import { getPicks } from '@/lib/picks';
import { research, researchFor, type ResearchReport } from '@/lib/research';
import { SPORT_ACCENT } from '@/lib/visual/identity';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Rendimiento' };

const MODEL_LABEL: Record<string, string> = {
  market_no_vig: 'Mercado', climatology: 'Baseline ingenuo', home_rate: 'Baseline local',
  elo_davidson: 'Elo-Davidson', online_poisson: 'Poisson online', elo_binary: 'Elo binario',
};
const label = (k: string) => MODEL_LABEL[k] ?? k;

function LogLossChart({ r }: { r: ResearchReport }) {
  const rows = [
    ...Object.entries(r.baselines).map(([k, b]) => ({ k, v: b.log_loss, kind: k === 'market_no_vig' ? 'market' : 'base' })),
    ...Object.entries(r.models).map(([k, m]) => ({ k, v: m.logLoss, kind: 'model' })),
  ].sort((a, b) => a.v - b.v);
  const min = Math.min(...rows.map((x) => x.v));
  const max = Math.max(...rows.map((x) => x.v));
  const floor = min - (max - min) * 0.6;
  return (
    <figure className="chart">
      <figcaption>Log loss en holdout (menor es mejor). Mercado = cuotas de cierre sin margen.</figcaption>
      {rows.map((x) => (
        <div key={x.k} className={`hbar hbar-${x.kind}`}>
          <span className="hbar-label">{label(x.k)}</span>
          <span className="hbar-track"><span className="hbar-fill" style={{ width: `${Math.max(6, ((x.v - floor) / (max - floor)) * 100)}%` }} /></span>
          <span className="hbar-value">{fmt(x.v)}</span>
        </div>
      ))}
    </figure>
  );
}

function RoiChart({ r }: { r: ResearchReport }) {
  const lo = -0.3;
  const hi = 0.2;
  const pos = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  return (
    <figure className="chart">
      <figcaption>ROI simulado con intervalo de confianza 95 % (apuesta plana de 1 u a cuota de cierre)</figcaption>
      {Object.entries(r.models).map(([k, m]) => (
        <div key={k} className="ci-row">
          <span className="hbar-label">{label(k)}</span>
          <span className="ci-track">
            <span className="ci-zero" style={{ left: pos(0) }} />
            <span className="ci-range" style={{ left: pos(m.betSim.roi_ci_low), width: `calc(${pos(m.betSim.roi_ci_high)} - ${pos(m.betSim.roi_ci_low)})` }} />
            <span className={`ci-point ${m.betSim.roi < 0 ? 'neg' : 'pos'}`} style={{ left: pos(m.betSim.roi) }} />
          </span>
          <span className={`hbar-value ${m.betSim.roi < 0 ? 'tone-neg' : 'tone-pos'}`}>{(m.betSim.roi * 100).toFixed(1)} %</span>
        </div>
      ))}
      <div className="ci-axis"><span>−30 %</span><span>0</span><span>+20 %</span></div>
    </figure>
  );
}

export default async function Performance() {
  const feed = await getPicks();
  const settled = 0; // Settled published picks come from the audited `published_performance` view; none exist yet.
  const evaluated = SPORTS.filter((s) => researchFor(s));
  const pending = SPORTS.filter((s) => !researchFor(s));

  return (
    <div className="stack">
      <PageHeader title="Rendimiento y" accent="validación." subtitle="Resultados auditados de picks publicados y validación de modelos contra el mercado." />

      <section aria-labelledby="h-results" className="stack-sm">
        <SectionHeader id="h-results" kicker="Picks publicados" title="Resultados auditados" />
        <div className="stat-grid">
          <StatTile label="ROI" value="—" sub="sin picks liquidados" tone="muted" />
          <StatTile label="Yield" value="—" sub="sin picks liquidados" tone="muted" />
          <StatTile label="Acierto" value="—" sub={`${settled} liquidados`} tone="muted" />
          <StatTile label="Ganados / perdidos" value="0 / 0" sub="historial vacío" tone="muted" />
          <StatTile label="Racha" value="—" sub="sin resultados" tone="muted" />
          <StatTile label="Publicados" value={feed.isDemo ? 0 : feed.data.length} sub={feed.isDemo ? 'modo demo' : 'activos'} tone="muted" />
        </div>
        <div className="panel chart-empty">
          <svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden className="chart-grid">
            {[30, 70, 110, 150].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} />)}
          </svg>
          <EmptyState title="La evolución del rendimiento aparecerá aquí" icon={<ChartColumn size={22} />}>
            Solo mostramos ROI, yield y rachas de picks reales publicados y liquidados. No hay resultados inventados ni de demostración en esta sección.
          </EmptyState>
        </div>
      </section>

      <section aria-labelledby="h-validation" className="stack-sm">
        <SectionHeader id="h-validation" kicker="Investigación offline" title="Validación de modelos" />
        <Notice tone="warn" title="Ningún modelo aprobado">{research.note} Los modelos evaluados no superan al mercado de cierre, por eso los picks reales siguen desactivados.</Notice>
        <div className="grid-2">
          {evaluated.map((s) => {
            const r = researchFor(s)!;
            return (
              <article key={s} className="panel research" style={{ ['--accent' as string]: SPORT_ACCENT[s] }} aria-labelledby={`r-${s}`}>
                <header className="research-head">
                  <span className="sport-icon"><SportGlyph sport={s} size={20} /></span>
                  <div>
                    <h3 id={`r-${s}`}>{SPORT_LABELS[s]}</h3>
                    <p>{r.market} · {r.holdout.events} partidos ({r.holdout.withOdds} con cuotas)</p>
                  </div>
                  <span className="badge badge-neg">No publicable</span>
                </header>
                <LogLossChart r={r} />
                <RoiChart r={r} />
                <dl className="research-facts">
                  {Object.entries(r.models).map(([k, m]) => (
                    <div key={k}><dt>{label(k)} vs mercado</dt><dd>{signed(m.vsMarket[0])} [{signed(m.vsMarket[1])}, {signed(m.vsMarket[2])}]</dd></div>
                  ))}
                  <div><dt>Holdout</dt><dd>{r.holdout.start} → {r.holdout.end}</dd></div>
                  <div><dt>Fuente</dt><dd>{r.source.provider} (solo investigación)</dd></div>
                </dl>
              </article>
            );
          })}
        </div>
        <div className="panel">
          <SectionHeader kicker="Pendiente" title="Sin evaluar" />
          <div className="pending-sports">
            {pending.map((s) => (
              <span key={s} className="pending-sport" style={{ ['--accent' as string]: SPORT_ACCENT[s] }}><SportGlyph sport={s} size={16} />{SPORT_LABELS[s]}</span>
            ))}
          </div>
          <p className="muted small"><Database size={14} aria-hidden className="inline-icon" /> Falta un dataset histórico con licencia y cobertura verificadas.</p>
        </div>
      </section>
    </div>
  );
}
