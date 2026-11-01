import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight, Lock, ShieldCheck } from 'lucide-react';
import { formatPercent, SPORT_LABELS } from '@vanta-edge/shared';
import { DemoBadge, MissingList, Notice, ProbabilityRing, SectionHeader, StatTile } from '@/components/ui';
import { SportArt, SportGlyph, TeamCrest } from '@/components/visual';
import { formatKickoff } from '@/lib/format';
import { getPicks } from '@/lib/picks';
import { getProvider } from '@/lib/providers';
import { SPORT_ACCENT } from '@/lib/visual/identity';
import { kickoffDay, kickoffTime } from '@/lib/visual/time';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Análisis del pick' };

const ID = /^[A-Za-z0-9-]{1,64}$/;

export default async function PickPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const feed = await getPicks();
  const pick = feed.data.find((p) => p.id === id);
  if (!pick) notFound();
  const game = await getProvider().getGame(pick.gameId);
  const hasProb = pick.probability != null;

  return (
    <div className="stack">
      <Link href="/picks" className="back-link"><ArrowLeft size={16} aria-hidden />Picks</Link>

      <article className="stack">
        <header className="pick-hero" style={{ ['--accent' as string]: SPORT_ACCENT[pick.sport] }}>
          <SportArt sport={pick.sport} />
          <div className="featured-top">
            <span className="badge badge-accent"><SportGlyph sport={pick.sport} size={14} />{SPORT_LABELS[pick.sport]}</span>
            {pick.isDemo ? <DemoBadge>DEMO · no es una recomendación</DemoBadge> : null}
          </div>
          <div className="pick-hero-main">
            {game ? (
              <div className="pick-hero-crests">
                <TeamCrest team={game.home} size={64} />
                <span className="vs">vs</span>
                <TeamCrest team={game.away} size={64} />
              </div>
            ) : null}
            <div>
              <p className="kicker">{pick.market}</p>
              <h1 className="display pick-hero-title">{pick.selection}</h1>
              {game ? <p className="pick-hero-sub">{game.home.name} vs {game.away.name} · {kickoffDay(game.startsAt)} {kickoffTime(game.startsAt)} CDMX</p> : null}
            </div>
          </div>
        </header>

        <div className="stat-row">
          <StatTile label="Probabilidad" value={hasProb ? formatPercent(pick.probability) : '—'} sub={hasProb ? 'modelo validado' : 'sin cálculo válido'} tone={hasProb ? 'pos' : 'muted'} />
          <StatTile label="Cuota" value={pick.odds != null ? pick.odds.toFixed(2) : '—'} sub={pick.odds != null ? 'decimal' : 'no disponible'} tone={pick.odds != null ? undefined : 'muted'} />
          <StatTile label="Ventaja vs mercado" value={pick.edge != null ? formatPercent(pick.edge) : '—'} sub={pick.edge != null ? 'estimada' : 'no calculada'} tone={pick.edge != null ? (pick.edge > 0 ? 'pos' : 'neg') : 'muted'} />
        </div>

        <div className="detail-grid">
          <section className="panel" aria-labelledby="h-analysis">
            <SectionHeader id="h-analysis" kicker="Análisis" title="Razonamiento" />
            <div className="confidence">
              {hasProb ? <ProbabilityRing value={pick.probability!} size={72} /> : <span className="prob-lock lg"><Lock size={24} aria-hidden /></span>}
              <div>
                <strong>{hasProb ? 'Confianza calculada por un modelo aprobado' : 'Nivel de confianza no disponible'}</strong>
                <p>{hasProb ? 'La probabilidad proviene de un modelo validado fuera de muestra.' : 'No mostramos un nivel de confianza sin un cálculo válido detrás.'}</p>
              </div>
            </div>
            <p className="editorial">{pick.explanation}</p>
            <Notice tone="info">Las probabilidades no son certezas. Consulta <Link href="/responsible">juego responsable</Link>.</Notice>
          </section>

          <section className="panel" aria-labelledby="h-missing">
            <SectionHeader id="h-missing" kicker="Contexto" title="Datos del análisis" />
            <MissingList items={[
              { label: 'Partido y horario', ok: Boolean(game) },
              { label: 'Probabilidad del modelo', ok: hasProb, note: 'Sin modelo aprobado' },
              { label: 'Cuota del mercado', ok: pick.odds != null, note: 'Requiere licencia' },
              { label: 'Estadísticas históricas', ok: false, note: 'Sin dataset' },
              { label: 'Tendencias del enfrentamiento', ok: false, note: 'Sin dataset' },
              { label: 'Alineaciones / lesiones', ok: false, note: 'Requiere proveedor' },
            ]} />
            <p className="muted small">Publicado: {formatKickoff(pick.publishedAt)}</p>
          </section>
        </div>

        {game ? (
          <Link href={`/games/${game.id}`} className="panel link-panel card-hover">
            <ShieldCheck size={20} aria-hidden />
            <span><strong>Ficha del partido</strong><small>{game.home.name} vs {game.away.name}</small></span>
            <ChevronRight size={18} aria-hidden />
          </Link>
        ) : null}
      </article>
    </div>
  );
}
