import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { isSport, SPORTS, type Sport } from '@vanta-edge/shared';
import { EmptyState, Notice, PageHeader, PickCard, SportFilter, StatTile } from '@/components/ui';
import { getPicks } from '@/lib/picks';
import { getProvider } from '@/lib/providers';
import { approvedModelCount, evaluatedModelCount } from '@/lib/research';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Picks' };

type Search = { sport?: string; market?: string; conf?: string };

export default async function Picks({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const sport = sp.sport && isSport(sp.sport) ? sp.sport : undefined;
  const [feed, games] = await Promise.all([getPicks(), getProvider().listGames({ limit: 100 })]);
  const byId = new Map(games.map((g) => [g.id, g]));
  const markets = [...new Set(feed.data.map((p) => p.market))];
  const withProb = feed.data.some((p) => p.probability != null);
  const market = sp.market && markets.includes(sp.market) ? sp.market : undefined;
  const conf = withProb && sp.conf === 'high' ? 'high' : undefined;
  const list = feed.data
    .filter((p) => !sport || p.sport === sport)
    .filter((p) => !market || p.market === market)
    .filter((p) => !conf || (p.probability ?? 0) >= 0.6);
  const counts = SPORTS.reduce((acc, s) => ({ ...acc, [s]: feed.data.filter((p) => p.sport === s).length }), {} as Record<Sport, number>);
  const published = feed.isDemo ? 0 : feed.data.length;
  const qs = (extra: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { sport, market, conf, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/picks?${s}` : '/picks';
  };

  return (
    <div className="stack">
      <PageHeader title="Picks con" accent="evidencia." subtitle="Solo se publican pronósticos de modelos aprobados, con historial inmutable." />
      <div className="stat-row">
        <StatTile label="Publicados" value={published} sub={feed.isDemo ? 'modo demo' : 'activos'} tone={published ? undefined : 'muted'} />
        <StatTile label="Modelos aprobados" value={`${approvedModelCount()}/${evaluatedModelCount()}`} sub="evaluados" tone={approvedModelCount() ? 'pos' : 'muted'} />
        <StatTile label="Con probabilidad" value={withProb ? feed.data.filter((p) => p.probability != null).length : '—'} sub={withProb ? 'calculada' : 'sin cálculo válido'} tone={withProb ? undefined : 'muted'} />
      </div>
      <Notice tone={feed.publicationEnabled ? 'info' : 'warn'} title={feed.publicationEnabled ? 'Publicación activa' : 'Publicación desactivada'}>
        {feed.note}{feed.isDemo ? ' Las tarjetas marcadas DEMO son ejemplos de interfaz: no son recomendaciones.' : ''}
      </Notice>

      <div className="sticky-filters stack-sm">
        <SportFilter active={sport} base="/picks" counts={counts} />
        {markets.length > 1 || withProb ? (
          <nav className="chip-scroller" aria-label="Filtrar por mercado y confianza">
            {markets.length > 1 ? markets.map((m) => (
              <Link key={m} href={qs({ market: market === m ? undefined : m })} className={`chip chip-sm ${market === m ? 'chip-on' : ''}`}>{m}</Link>
            )) : null}
            {withProb ? <Link href={qs({ conf: conf ? undefined : 'high' })} className={`chip chip-sm ${conf ? 'chip-on' : ''}`}>Confianza ≥ 60 %</Link> : null}
          </nav>
        ) : (
          <p className="filter-note">Filtros por mercado, jugador y confianza: se activan cuando existan picks con esos datos.</p>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState title="Sin picks para este filtro" icon={<Flame size={22} />} action={{ href: '/picks', label: 'Ver todos' }}>
          Cuando un modelo supere la validación y sea aprobado, sus pronósticos aparecerán aquí.
        </EmptyState>
      ) : (
        <div className="grid-picks">{list.map((p) => <PickCard key={p.id} pick={p} game={byId.get(p.gameId) ?? null} />)}</div>
      )}
    </div>
  );
}
