import Image from 'next/image';
import type { Sport, Team } from '@vanta-edge/shared';
import { SPORT_ACCENT, SPORT_KIND, teamIdentity } from '@/lib/visual/identity';

/* All artwork in this file is original SVG drawn for IA Picks (no third-party assets). */

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="brand-mark">
      <rect x="1" y="1" width="38" height="38" rx="12" fill="#0b1f18" stroke="#2fd182" strokeOpacity="0.7" strokeWidth="1.5" />
      <path d="M10.5 28.5V11.5h4.2v17zM18.5 28.5l6.3-17h3.6l6.3 17h-4.4l-1.2-3.5h-5.2l-1.2 3.5zm6.5-7h3.3l-1.65-4.9z" fill="#2fd182" />
      <path d="M3 30.5c8-2.2 22-2.2 34 0" stroke="#93f2c2" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function SportGlyph({ sport, size = 18 }: { sport: Sport; size?: number }) {
  const kind = SPORT_KIND[sport];
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (sport === 'UCL') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === 'soccer') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.2l3.2 2.3-1.2 3.8h-4l-1.2-3.8zM12 3v4.2M15.2 9.5l4.6-1.4M14 13.3l2.8 3.9M10 13.3l-2.8 3.9M8.8 9.5L4.2 8.1" />
      </svg>
    );
  }
  if (kind === 'football') {
    return (
      <svg {...common}>
        <path d="M4.5 19.5c-1.6-5.5 1.2-12.6 8-14.6 2.6-.8 5-.6 7 .1 1.6 5.5-1.2 12.6-8 14.6-2.6.8-5 .6-7-.1z" />
        <path d="M9.5 14.5l5-5M10.5 11l1 1M12 9.5l1 1M13 12.5l1 1M4.5 19.5l2.2-.6M19.5 4.5l-.6 2.2" />
      </svg>
    );
  }
  if (kind === 'baseball') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M6.5 5.2c1.8 1.8 2.6 4.2 2.4 6.8s-1.3 4.8-3.2 6.4M17.5 5.2c-1.8 1.8-2.6 4.2-2.4 6.8s1.3 4.8 3.2 6.4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18M5.6 5.6c2.8 2.8 2.8 10 0 12.8M18.4 5.6c-2.8 2.8-2.8 10 0 12.8" />
    </svg>
  );
}

/** Decorative field/court line art used as the visual identity of an event or sport. */
export function SportArt({ sport, className = '' }: { sport: Sport; className?: string }) {
  const kind = SPORT_KIND[sport];
  const accent = SPORT_ACCENT[sport];
  const stroke = { stroke: accent, strokeOpacity: 0.22, strokeWidth: 1.4, fill: 'none' };
  return (
    <svg className={`sport-art ${className}`} viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {kind === 'soccer' ? (
        <g {...stroke}>
          <rect x="20" y="20" width="360" height="180" rx="4" />
          <line x1="200" y1="20" x2="200" y2="200" />
          <circle cx="200" cy="110" r="34" />
          <rect x="20" y="62" width="54" height="96" />
          <rect x="326" y="62" width="54" height="96" />
          <rect x="20" y="88" width="20" height="44" />
          <rect x="360" y="88" width="20" height="44" />
        </g>
      ) : null}
      {kind === 'football' ? (
        <g {...stroke}>
          <rect x="20" y="20" width="360" height="180" rx="4" />
          {Array.from({ length: 9 }, (_, i) => <line key={i} x1={56 + i * 36} y1="20" x2={56 + i * 36} y2="200" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1={56 + i * 36 - 4} y1="80" x2={56 + i * 36 + 4} y2="80" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`k${i}`} x1={56 + i * 36 - 4} y1="140" x2={56 + i * 36 + 4} y2="140" />)}
        </g>
      ) : null}
      {kind === 'baseball' ? (
        <g {...stroke}>
          <path d="M200 205L95 100A148 148 0 0 1 305 100z" />
          <path d="M200 190l-45-45 45-45 45 45z" />
          <circle cx="200" cy="145" r="9" />
          <path d="M60 70Q200-30 340 70" />
        </g>
      ) : null}
      {kind === 'basketball' ? (
        <g {...stroke}>
          <rect x="20" y="20" width="360" height="180" rx="4" />
          <line x1="200" y1="20" x2="200" y2="200" />
          <circle cx="200" cy="110" r="28" />
          <rect x="20" y="78" width="70" height="64" />
          <rect x="310" y="78" width="70" height="64" />
          <path d="M20 42h20a80 80 0 0 1 0 136H20M380 42h-20a80 80 0 0 0 0 136h20" />
        </g>
      ) : null}
    </svg>
  );
}

/**
 * Team crest. Uses the provider's licensed logo when present; otherwise an original monogram shield
 * tinted with the club colours. Fixed dimensions avoid layout shift; remote logos lazy-load.
 */
export function TeamCrest({ team, size = 44 }: { team: Pick<Team, 'id' | 'name' | 'shortName' | 'logoUrl'>; size?: number }) {
  const id = teamIdentity(team);
  if (id.logoUrl) {
    return (
      <span className="crest crest-img" style={{ width: size, height: size }}>
        <Image src={id.logoUrl} alt={`Escudo de ${team.name}`} width={size} height={size} loading="lazy" unoptimized />
      </span>
    );
  }
  const fs = id.monogram.length > 2 ? 11 : 13;
  return (
    <span className="crest" style={{ width: size, height: size }} role="img" aria-label={`Identidad de ${team.name}`}>
      <svg viewBox="0 0 44 48" width={size} height={size} aria-hidden>
        <path d="M22 2.5l17 5.2v14.6c0 11.3-7.4 19.4-17 23.2C12.4 41.7 5 33.6 5 22.3V7.7z" fill={id.primary} stroke={id.secondary} strokeWidth="2" />
        <path d="M22 4.6l15 4.6v6.2C29 13 15 13 7 15.4V9.2z" fill="#fff" fillOpacity="0.14" />
        <path d="M5.6 30h32.8" stroke={id.secondary} strokeOpacity="0.55" strokeWidth="1.6" />
        <text x="22" y="24.5" textAnchor="middle" fontFamily="var(--font-display), system-ui, sans-serif" fontWeight="800" fontSize={fs} fill={id.ink} letterSpacing="-0.3">
          {id.monogram}
        </text>
      </svg>
    </span>
  );
}

export function CrestPair({ home, away, size = 34 }: { home: Team; away: Team; size?: number }) {
  return (
    <span className="crest-pair" aria-hidden>
      <TeamCrest team={home} size={size} />
      <TeamCrest team={away} size={size} />
    </span>
  );
}
