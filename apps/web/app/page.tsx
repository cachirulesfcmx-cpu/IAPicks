import Link from 'next/link';
import { CalendarDays, ChartColumn, ChevronRight, Flame, Radio, ShieldCheck, Wallet } from 'lucide-react';
import { SPORTS, type Sport } from '@vanta-edge/shared';
import { DemoBadge, EmptyState, FeaturedMatch, MatchCard, Notice, PickCard, SectionHeader } from '@/components/ui';
import { SportArt, SportGlyph } from '@/components/visual';
import { getPicks } from '@/lib/picks';
import { getProvider } from '@/lib/providers';
import { approvedModelCount, evaluatedModelCount } from '@/lib/research';
import { localDayKey } from '@/lib/format';
import { SPORT_ACCENT, SPORT_REGION, SPORT_SHORT } from '@/lib/visual/identity';
import { greeting, todayLabel } from '@/lib/visual/time';

export const dynamic = 'force-dynamic';

const QUICK = [
  { href: '/games', label: 'Calendario', sub: 'Agenda', Icon: CalendarDays },
  { href: '/picks', label: 'Picks', sub: 'Pronósticos', Icon: Flame },
  { href: '/performance', label: 'Rendimiento', sub: 'Validación', Icon: ChartColumn },
  { href: '/bankroll', label: 'Bankroll', sub: 'Stake', Icon: Wallet },
];

export default async function Home() {
  const now = new Date();
  const provider = getProvider();
  const [games, feed] = await Promise.all([provider.listGames({ limit: 100 }), getPicks()]);
  const upcoming = games.filter((g) => g.status === 'scheduled' || g.status === 'live');
  const live = games.filter((g) => g.status === 'live');
  const today = games.filter((g) => localDayKey(g.startsAt) === localDayKey(now.toISOString()));
  const featured = upcoming[0];
  const byId = new Map(games.map((g) => [g.id, g]));
  const counts = SPORTS.reduce((acc, s) => ({ ...acc, [s]: games.filter((g) => g.sport === s).length }), {} as Record<Sport, number>);
  const approved = approvedModelCount();
  const evaluated = evaluatedModelCount();

  return (
    <div className="stack-lg">
      <section className="hero">
        <div className="hero-glow" aria-hidden />
        <p className="hero-greet">{greeting(now)} · <span className="cap">{todayLabel(now)}</span></p>
        <h1 className="display hero-title">Lee el juego.<br /><em>Entiende la probabilidad.</em></h1>
        <p className="hero-copy">Inteligencia deportiva con evidencia: calendario, datos y modelos validados contra el mercado antes de publicar.</p>
        <div className="hero-stats">
          <div><strong>{today.length}</strong><span>partidos hoy</span></div>
          <div><strong>{upcoming.length}</strong><span>próximos</span></div>
          <div><strong>{SPORTS.length}</strong><span>torneos</span></div>
          <div><strong className={approved ? 'tone-pos' : ''}>{approved}/{evaluated}</strong><span>modelos aprobados</span></div>
        </div>
        {provider.isDemo ? <p className="hero-demo"><DemoBadge>DEMO</DemoBadge> Partidos ficticios para mostrar la experiencia. Sin cuotas en vivo ni picks reales.</p> : null}
      </section>

      <nav className="quick" aria-label="Accesos rápidos">
        {QUICK.map(({ href, label, sub, Icon }) => (
          <Link key={href} href={href} className="quick-item card-hover">
            <span className="quick-icon"><Icon size={20} aria-hidden /></span>
            <span><strong>{label}</strong><small>{sub}</small></span>
          </Link>
        ))}
      </nav>

      {featured ? (
        <section aria-labelledby="h-featured">
          <SectionHeader id="h-featured" kicker="Destacado" title="Partido de la jornada" action={{ href: '/games', label: 'Calendario' }} />
          <FeaturedMatch game={featured} now={now} />
        </section>
      ) : null}

      <section aria-labelledby="h-live">
        <SectionHeader id="h-live" kicker={<><span className="live-dot" aria-hidden /> En directo</>} title="En vivo" />
        {live.length ? (
          <div className="rail-scroll">{live.map((g) => <MatchCard key={g.id} game={g} now={now} />)}</div>
        ) : (
          <EmptyState title="No hay partidos en vivo ahora" icon={<Radio size={22} />}>
            Los marcadores en directo aparecerán aquí cuando el proveedor de datos con licencia esté conectado.
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="h-picks">
        <SectionHeader id="h-picks" kicker="Pronósticos" title="Picks destacados" action={{ href: '/picks', label: 'Ver todos' }} />
        {!feed.publicationEnabled ? (
          <Notice tone="warn" title="Publicación desactivada">{feed.note} Las tarjetas son de demostración y no incluyen probabilidad.</Notice>
        ) : null}
        <div className="rail-scroll rail-picks">
          {feed.data.slice(0, 6).map((p) => <PickCard key={p.id} pick={p} game={byId.get(p.gameId) ?? null} />)}
        </div>
      </section>

      <section aria-labelledby="h-next">
        <SectionHeader id="h-next" kicker="Agenda" title="Próximos partidos" action={{ href: '/games', label: 'Ver calendario' }} />
        <div className="grid-cards">{upcoming.slice(1, 7).map((g) => <MatchCard key={g.id} game={g} now={now} />)}</div>
      </section>

      <section aria-labelledby="h-sports">
        <SectionHeader id="h-sports" kicker="Explora" title="Por deporte" />
        <div className="sport-grid">
          {SPORTS.map((s) => (
            <Link key={s} href={`/games?sport=${s}`} className="sport-tile card-hover" style={{ ['--accent' as string]: SPORT_ACCENT[s] }}>
              <SportArt sport={s} />
              <span className="sport-icon"><SportGlyph sport={s} size={22} /></span>
              <span className="sport-name">{SPORT_SHORT[s]}</span>
              <span className="sport-region">{SPORT_REGION[s]}</span>
              <span className="sport-count">{counts[s]} partidos <ChevronRight size={14} aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="trust" aria-labelledby="h-trust">
        <ShieldCheck size={22} aria-hidden />
        <div>
          <h2 id="h-trust">Transparencia primero</h2>
          <p>Solo publicamos probabilidades de modelos que superan una validación fuera de muestra contra el mercado. Hoy: {approved} de {evaluated} modelos aprobados.</p>
          <Link href="/performance" className="link-more">Ver validación <ChevronRight size={16} aria-hidden /></Link>
        </div>
      </section>
    </div>
  );
}
