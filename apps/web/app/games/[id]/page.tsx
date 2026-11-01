import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChartColumn, History, Lock } from 'lucide-react';
import { GameIdSchema, isStale, SPORT_LABELS, SPORT_META } from '@vanta-edge/shared';
import { DemoBadge, EmptyState, MissingList, Notice, PickCard, SectionHeader, StatusPill } from '@/components/ui';
import { SportArt, SportGlyph, TeamCrest } from '@/components/visual';
import { formatKickoff } from '@/lib/format';
import { getPicks } from '@/lib/picks';
import { getProvider } from '@/lib/providers';
import { researchFor } from '@/lib/research';
import { SPORT_ACCENT, SPORT_KIND } from '@/lib/visual/identity';
import { kickoffDay, kickoffTime, startsIn } from '@/lib/visual/time';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Ficha de partido' };

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const now = new Date();
  const { id } = await params;
  const parsed = GameIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  const game = await getProvider().getGame(parsed.data);
  if (!game) notFound();
  const stale = !game.isDemo && isStale(game, now);
  const research = researchFor(game.sport);
  const related = (await getPicks()).data.filter((p) => p.gameId === game.id);
  const hasScore = game.homeScore != null && game.awayScore != null;

  return (
    <div className="stack">
      <Link href={`/games?sport=${game.sport}`} className="back-link"><ArrowLeft size={16} aria-hidden />{SPORT_LABELS[game.sport]}</Link>

      <section className="match-hero" style={{ ['--accent' as string]: SPORT_ACCENT[game.sport] }} aria-labelledby="match-title">
        <SportArt sport={game.sport} />
        <div className="featured-top">
          <span className="badge badge-accent"><SportGlyph sport={game.sport} size={14} />{game.competition}</span>
          {game.isDemo ? <DemoBadge>DEMO · partido ficticio</DemoBadge> : <StatusPill status={game.status} />}
        </div>
        <h1 id="match-title" className="sr-only">{game.home.name} vs {game.away.name}</h1>
        <div className="featured-row">
          <div className="featured-team">
            <TeamCrest team={game.home} size={84} />
            <strong>{game.home.name}</strong>
            <span>Local · {game.home.shortName}</span>
          </div>
          <div className="featured-center">
            {hasScore ? (
              <span className="featured-time" aria-label={`Marcador ${game.homeScore} a ${game.awayScore}`}>{game.homeScore}<span className="score-sep">–</span>{game.awayScore}</span>
            ) : (
              <>
                <span className="match-day">{kickoffDay(game.startsAt, now)}</span>
                <time className="featured-time" dateTime={game.startsAt}>{kickoffTime(game.startsAt)}</time>
              </>
            )}
            <span className="match-sub">{game.status === 'scheduled' ? `${startsIn(game.startsAt, now)} · CDMX` : <StatusPill status={game.status} />}</span>
          </div>
          <div className="featured-team">
            <TeamCrest team={game.away} size={84} />
            <strong>{game.away.name}</strong>
            <span>Visitante · {game.away.shortName}</span>
          </div>
        </div>
        <p className="match-when"><time dateTime={game.startsAt}>{formatKickoff(game.startsAt)}</time></p>
      </section>

      {stale ? <Notice tone="warn" title="Datos desactualizados">El proveedor no ha refrescado este partido recientemente.</Notice> : null}

      <div className="detail-grid">
        <section className="panel" aria-labelledby="h-prob">
          <SectionHeader id="h-prob" kicker="Modelo" title="Probabilidades" />
          <div className="prob-empty">
            <span className="prob-lock"><Lock size={20} aria-hidden /></span>
            <div>
              <strong>Sin probabilidad publicada</strong>
              <p>No hay un modelo validado para {SPORT_LABELS[game.sport]}. Baseline previsto: {SPORT_META[game.sport].baseline}.</p>
            </div>
          </div>
          <div className="prob-bars" aria-hidden>
            {(SPORT_KIND[game.sport] === 'soccer' ? [game.home.shortName, 'Empate', game.away.shortName] : [game.home.shortName, game.away.shortName]).map((l) => (
              <div key={l} className="prob-bar"><span>{l}</span><span className="bar"><span className="bar-fill bar-empty" /></span><span>—</span></div>
            ))}
          </div>
          {research ? <Link className="link-more" href="/performance">Ver resultados de validación <ChartColumn size={15} aria-hidden /></Link> : <p className="muted small">Sin dataset histórico validado todavía.</p>}
        </section>

        <section className="panel" aria-labelledby="h-data">
          <SectionHeader id="h-data" kicker="Cobertura" title="Datos del partido" />
          <MissingList items={[
            { label: 'Horario y equipos', ok: true },
            { label: 'Marcador en vivo', ok: hasScore, note: game.isDemo ? 'Demo: sin marcador' : 'Pendiente' },
            { label: 'Estadísticas del partido', ok: false, note: 'Requiere proveedor' },
            { label: 'Alineaciones y lesiones', ok: false, note: 'Requiere proveedor' },
            { label: 'Cuotas del mercado', ok: false, note: 'Requiere licencia' },
            { label: 'Calidad del dato', ok: !game.isDemo, note: game.isDemo ? 'Demostración' : game.dataQuality },
          ]} />
          <p className="muted small">Última actualización: {game.sourceUpdatedAt ? formatKickoff(game.sourceUpdatedAt) : 'no disponible'}</p>
        </section>
      </div>

      <section className="panel" aria-labelledby="h-form">
        <SectionHeader id="h-form" kicker="Tendencias" title="Forma reciente y comparativa" />
        <div className="compare">
          {[game.home, game.away].map((t) => (
            <div key={t.id} className="compare-team">
              <TeamCrest team={t} size={36} />
              <strong>{t.shortName}</strong>
              <span className="form-dots" aria-label="Últimos cinco resultados: sin datos">{Array.from({ length: 5 }, (_, i) => <span key={i} className="form-dot" />)}</span>
            </div>
          ))}
        </div>
        <EmptyState title="Historial y tendencias no disponibles" icon={<History size={22} />}>
          Se mostrarán los últimos resultados, enfrentamientos directos y comparativas cuando exista un dataset histórico con licencia para esta competición.
        </EmptyState>
      </section>

      <section aria-labelledby="h-related">
        <SectionHeader id="h-related" kicker="Pronósticos" title="Picks de este partido" />
        {related.length ? <div className="grid-cards">{related.map((p) => <PickCard key={p.id} pick={p} game={game} />)}</div> : (
          <EmptyState title="Sin picks para este partido">Cuando un modelo aprobado publique un pronóstico para este encuentro, aparecerá aquí.</EmptyState>
        )}
      </section>
    </div>
  );
}
