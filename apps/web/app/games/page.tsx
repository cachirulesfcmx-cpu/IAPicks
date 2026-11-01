import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { isSport, SPORT_LABELS, SPORTS, type Sport } from '@vanta-edge/shared';
import { EmptyState, MatchCard, Notice, PageHeader, SportFilter } from '@/components/ui';
import { groupByDay } from '@/lib/format';
import { getProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Partidos' };

export default async function Games({ searchParams }: { searchParams: Promise<{ sport?: string }> }) {
  const now = new Date();
  const { sport: raw } = await searchParams;
  const sport = raw && isSport(raw) ? raw : undefined;
  const provider = getProvider();
  const all = await provider.listGames({ limit: 100 });
  const games = sport ? all.filter((g) => g.sport === sport) : all;
  const counts = SPORTS.reduce((acc, s) => ({ ...acc, [s]: all.filter((g) => g.sport === s).length }), {} as Record<Sport, number>);
  const days = groupByDay(games);
  return (
    <div className="stack">
      <PageHeader title="Calendario" accent={sport ? SPORT_LABELS[sport] : 'deportivo.'}
        subtitle={<>{games.length} partidos · horarios en CDMX{provider.isDemo ? ' · datos de demostración' : ''}</>} />
      <div className="sticky-filters"><SportFilter active={sport} base="/games" counts={counts} /></div>
      {provider.isDemo ? <Notice tone="warn" title="Partidos ficticios">Los enfrentamientos y horarios son de demostración (marcados DEMO); no son calendarios confirmados.</Notice> : null}
      {raw && !sport ? <EmptyState title="Deporte no reconocido">Elige una de las seis competiciones disponibles.</EmptyState> : null}
      {days.length === 0 ? (
        <EmptyState title="Sin partidos" icon={<CalendarDays size={22} />}>No hay partidos para este filtro. Si el proveedor no cubre esta competición, verás “datos no disponibles”.</EmptyState>
      ) : days.map((d) => (
        <section key={d.day} aria-labelledby={`day-${d.day}`} className="day-group">
          <h2 className="day-title" id={`day-${d.day}`}><span className="cap">{d.label}</span><span className="day-count">{d.items.length}</span></h2>
          <div className="grid-cards">{d.items.map((g) => <MatchCard key={g.id} game={g} now={now} />)}</div>
        </section>
      ))}
    </div>
  );
}
