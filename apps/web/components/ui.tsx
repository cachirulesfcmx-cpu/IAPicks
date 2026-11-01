import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight, CircleDot, Lock } from 'lucide-react';
import { formatPercent, SPORT_LABELS, SPORTS, type Game, type Pick, type Sport } from '@vanta-edge/shared';
import { SPORT_ACCENT, SPORT_SHORT } from '@/lib/visual/identity';
import { kickoffDay, kickoffTime, startsIn } from '@/lib/visual/time';
import { SportArt, SportGlyph, TeamCrest } from './visual';

export function DemoBadge({ children = 'DEMO' }: { children?: ReactNode }) {
  return <span className="badge badge-demo" title="Dato de demostración: ficticio">{children}</span>;
}

const STATUS_LABEL: Record<Game['status'], string> = {
  scheduled: 'Programado', live: 'En vivo', final: 'Final', postponed: 'Pospuesto', cancelled: 'Cancelado',
};

export function StatusPill({ status }: { status: Game['status'] }) {
  return (
    <span className={`badge badge-status badge-${status}`}>
      {status === 'live' ? <span className="live-dot" aria-hidden /> : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SectionHeader({ title, kicker, action, id }: { title: ReactNode; kicker?: ReactNode; action?: { href: string; label: string }; id?: string }) {
  return (
    <div className="section-header">
      <div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h2 id={id}>{title}</h2>
      </div>
      {action ? (
        <Link href={action.href} className="link-more">{action.label}<ChevronRight size={16} aria-hidden /></Link>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, accent, subtitle, children }: { title: string; accent?: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-header">
      <h1 className="display">
        {title}{accent ? <> <em>{accent}</em></> : null}
      </h1>
      {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      {children}
    </header>
  );
}

export function EmptyState({ title, children, icon, action }: { title: string; children?: ReactNode; icon?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="empty" role="status">
      <div className="empty-icon" aria-hidden>{icon ?? <CircleDot size={22} />}</div>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action ? <Link className="btn btn-ghost btn-sm" href={action.href}>{action.label}</Link> : null}
    </div>
  );
}

export function Notice({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'warn'; title?: string }) {
  return (
    <div className={`notice notice-${tone}`} role="note">
      <span className="notice-bar" aria-hidden />
      <div>
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function SportFilter({ active, base, counts }: { active?: Sport; base: string; counts?: Partial<Record<Sport, number>> }) {
  return (
    <nav className="chip-scroller" aria-label="Filtrar por deporte">
      <Link href={base} className={`chip ${!active ? 'chip-on' : ''}`} aria-current={!active ? 'page' : undefined}>Todos</Link>
      {SPORTS.map((s) => (
        <Link key={s} href={`${base}?sport=${s}`} className={`chip ${active === s ? 'chip-on' : ''}`} aria-current={active === s ? 'page' : undefined}
          style={{ ['--accent' as string]: SPORT_ACCENT[s] }}>
          <SportGlyph sport={s} size={16} />
          {SPORT_SHORT[s]}
          {counts?.[s] != null ? <span className="chip-count">{counts[s]}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

function Side({ team, align }: { team: Game['home']; align: 'left' | 'right' }) {
  return (
    <div className={`match-side match-side-${align}`}>
      <TeamCrest team={team} size={46} />
      <span className="team-abbr">{team.shortName}</span>
      <span className="team-full">{team.name}</span>
    </div>
  );
}

function Center({ game, now }: { game: Game; now: Date }) {
  const hasScore = game.homeScore != null && game.awayScore != null;
  return (
    <div className="match-center">
      {game.status === 'live' ? <StatusPill status="live" /> : <span className="match-day">{kickoffDay(game.startsAt, now)}</span>}
      {hasScore ? (
        <span className="match-score" aria-label={`Marcador ${game.homeScore} a ${game.awayScore}`}>
          {game.homeScore}<span className="score-sep">–</span>{game.awayScore}
        </span>
      ) : (
        <time className="match-time" dateTime={game.startsAt}>{kickoffTime(game.startsAt)}</time>
      )}
      {game.status === 'scheduled' ? <span className="match-sub">{startsIn(game.startsAt, now)}</span> : game.status !== 'live' ? <StatusPill status={game.status} /> : null}
    </div>
  );
}

/** Schedule card: crest · time/score · crest. The whole card is one link to the match page. */
export function MatchCard({ game, now = new Date() }: { game: Game; now?: Date }) {
  return (
    <Link href={`/games/${game.id}`} className="match-card card-hover" aria-label={`${game.home.name} contra ${game.away.name}, ${SPORT_LABELS[game.sport]}`}
      style={{ ['--accent' as string]: SPORT_ACCENT[game.sport] }}>
      <div className="match-top">
        <span className="comp"><SportGlyph sport={game.sport} size={14} />{game.competition}</span>
        {game.isDemo ? <DemoBadge>DEMO · ficticio</DemoBadge> : null}
      </div>
      <div className="match-row">
        <Side team={game.home} align="left" />
        <Center game={game} now={now} />
        <Side team={game.away} align="right" />
      </div>
    </Link>
  );
}

export function FeaturedMatch({ game, now = new Date() }: { game: Game; now?: Date }) {
  return (
    <Link href={`/games/${game.id}`} className="featured card-hover" style={{ ['--accent' as string]: SPORT_ACCENT[game.sport] }}
      aria-label={`Partido destacado: ${game.home.name} contra ${game.away.name}`}>
      <SportArt sport={game.sport} />
      <div className="featured-top">
        <span className="badge badge-accent"><SportGlyph sport={game.sport} size={14} />{game.competition}</span>
        {game.isDemo ? <DemoBadge>DEMO · partido ficticio</DemoBadge> : <StatusPill status={game.status} />}
      </div>
      <div className="featured-row">
        <div className="featured-team">
          <TeamCrest team={game.home} size={72} />
          <strong>{game.home.name}</strong>
          <span>Local</span>
        </div>
        <div className="featured-center">
          <span className="match-day">{kickoffDay(game.startsAt, now)}</span>
          <time className="featured-time" dateTime={game.startsAt}>{kickoffTime(game.startsAt)}</time>
          <span className="match-sub">{startsIn(game.startsAt, now)} · CDMX</span>
        </div>
        <div className="featured-team">
          <TeamCrest team={game.away} size={72} />
          <strong>{game.away.name}</strong>
          <span>Visitante</span>
        </div>
      </div>
      <span className="featured-cta">Ver ficha del partido <ChevronRight size={16} aria-hidden /></span>
    </Link>
  );
}

export function ProbabilityRing({ value, size = 56 }: { value: number; size?: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" className="ring" role="img" aria-label={`Probabilidad ${formatPercent(value)}`}>
      <circle cx="28" cy="28" r={r} className="ring-track" />
      <circle cx="28" cy="28" r={r} className="ring-value" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 28 28)" />
      <text x="28" y="32" textAnchor="middle">{Math.round(value * 100)}%</text>
    </svg>
  );
}

/** Pick card. Odds and confidence render only when they exist; otherwise the gap is stated. */
export function PickCard({ pick, game }: { pick: Pick; game: Game | null }) {
  const accent = SPORT_ACCENT[pick.sport];
  return (
    <Link href={`/picks/${pick.id}`} className="pick-card card-hover" style={{ ['--accent' as string]: accent }}
      aria-label={`Pick ${pick.selection}${game ? `, ${game.home.name} contra ${game.away.name}` : ''}`}>
      <div className="pick-visual">
        <SportArt sport={pick.sport} />
        {game ? (
          <div className="pick-crests">
            <TeamCrest team={game.home} size={40} />
            <TeamCrest team={game.away} size={40} />
          </div>
        ) : <SportGlyph sport={pick.sport} size={30} />}
      </div>
      <div className="pick-body">
        <div className="pick-meta">
          <span className="comp"><SportGlyph sport={pick.sport} size={13} />{SPORT_SHORT[pick.sport]}</span>
          {pick.isDemo ? <DemoBadge /> : null}
        </div>
        <h3 className="pick-title">{game ? `${game.home.shortName} vs ${game.away.shortName}` : pick.market}</h3>
        <p className="pick-sub">{game ? `${kickoffDay(game.startsAt)} · ${kickoffTime(game.startsAt)}` : SPORT_LABELS[pick.sport]}</p>
        <div className="pick-tags">
          <span className="tag tag-market">{pick.market}</span>
          {/* Without a published probability the selection is only a placeholder, so it is not repeated as a tag. */}
          {pick.probability != null ? <span className="tag tag-pos">{pick.selection}</span> : null}
        </div>
      </div>
      <div className="pick-side">
        {pick.probability != null ? <ProbabilityRing value={pick.probability} size={52} /> : (
          <span className="no-prob" title="Sin probabilidad publicada"><Lock size={14} aria-hidden />Sin pronóstico publicado</span>
        )}
        {pick.odds != null ? <span className="odds">cuota <strong>{pick.odds.toFixed(2)}</strong></span> : null}
      </div>
    </Link>
  );
}

export function StatTile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'pos' | 'neg' | 'muted' }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${tone ? `tone-${tone}` : ''}`}>{value}</span>
      {sub ? <span className="stat-sub">{sub}</span> : null}
    </div>
  );
}

export function MissingList({ items }: { items: { label: string; ok: boolean; note?: string }[] }) {
  return (
    <ul className="missing-list">
      {items.map((it) => (
        <li key={it.label} className={it.ok ? 'is-ok' : 'is-missing'}>
          <span className="dot" aria-hidden />
          <span>{it.label}</span>
          <span className="missing-note">{it.ok ? 'Disponible' : it.note ?? 'Sin datos'}</span>
        </li>
      ))}
    </ul>
  );
}
