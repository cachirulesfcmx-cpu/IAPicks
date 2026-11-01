import type { Sport, Team } from '@vanta-edge/shared';

/**
 * Visual identity layer.
 *
 * Official crests, league logos and player photos are trademarked/licensed assets, so this app never
 * hot-links or invents image URLs. A team shows a real logo only when the data provider supplies
 * `team.logoUrl` (licensed feed). Otherwise it gets a generated monogram crest in the club's
 * colours. Colours are plain facts (not copyrighted artwork) and only tint our own original shape.
 *
 * To plug in a licensed image provider later, populate `logoUrl` in the provider mapping
 * (lib/providers/*) or implement `resolveTeamLogo` below; every component reads through it.
 */
export type TeamIdentity = { primary: string; secondary: string; ink: string; monogram: string; logoUrl: string | null };

const PALETTE: Record<string, [string, string]> = {
  // Liga MX
  'tigres-uanl': ['#f5b400', '#1b3c8f'],
  'pumas-unam': ['#0b2a5b', '#c9a227'],
  'club-america': ['#ffd200', '#0b2a63'],
  guadalajara: ['#d71920', '#0f2d6b'],
  // Europe
  arsenal: ['#db0007', '#ffffff'],
  inter: ['#0068a8', '#111111'],
  'real-madrid': ['#f3f3f3', '#c8a24a'],
  'bayern-munich': ['#dc052d', '#0066b2'],
  barcelona: ['#a50044', '#004d98'],
  'atletico-de-madrid': ['#cb3524', '#262e61'],
  'real-sociedad': ['#0067b1', '#ffffff'],
  sevilla: ['#d81e05', '#ffffff'],
  // NFL
  'kansas-city-chiefs': ['#e31837', '#ffb81c'],
  'buffalo-bills': ['#00338d', '#c60c30'],
  'dallas-cowboys': ['#041e42', '#869397'],
  'philadelphia-eagles': ['#004c54', '#a5acaf'],
  // MLB
  'los-angeles-dodgers': ['#005a9c', '#ef3e42'],
  'new-york-mets': ['#002d72', '#ff5910'],
  'new-york-yankees': ['#0c2340', '#c4ced3'],
  'boston-red-sox': ['#bd3039', '#0c2340'],
  // NBA
  'boston-celtics': ['#007a33', '#ba9653'],
  'golden-state-warriors': ['#1d428a', '#ffc72c'],
  'denver-nuggets': ['#0e2240', '#fec524'],
  'los-angeles-lakers': ['#552583', '#fdb927'],
};

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function hashHue(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

/** Relative luminance check so the monogram stays legible on light kits (e.g. Real Madrid white). */
function isLight(hex: string): boolean {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 165;
}

export function resolveTeamLogo(team: Pick<Team, 'logoUrl'>): string | null {
  const url = team.logoUrl ?? null;
  return url && /^https:\/\//.test(url) ? url : null;
}

export function teamIdentity(team: Pick<Team, 'id' | 'name' | 'shortName' | 'logoUrl'>): TeamIdentity {
  const key = slug(team.id || team.name);
  const known = PALETTE[key] ?? PALETTE[slug(team.name)];
  const hue = hashHue(team.name);
  const [primary, secondary] = known ?? [`hsl(${hue} 55% 34%)`, `hsl(${(hue + 40) % 360} 60% 60%)`];
  const ink = known && isLight(primary) ? '#0b1a14' : '#ffffff';
  const monogram = (team.shortName || team.name).replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || '?';
  return { primary, secondary, ink, monogram, logoUrl: resolveTeamLogo(team) };
}

export const SPORT_ACCENT: Record<Sport, string> = {
  LIGA_MX: '#2fd182', UCL: '#7aa7ff', LALIGA: '#ff7a59', NFL: '#c9a35c', MLB: '#5ec8ff', NBA: '#ff9f43',
};

export const SPORT_KIND: Record<Sport, 'soccer' | 'football' | 'baseball' | 'basketball'> = {
  LIGA_MX: 'soccer', UCL: 'soccer', LALIGA: 'soccer', NFL: 'football', MLB: 'baseball', NBA: 'basketball',
};

export const SPORT_SHORT: Record<Sport, string> = {
  LIGA_MX: 'Liga MX', UCL: 'UCL', LALIGA: 'LaLiga', NFL: 'NFL', MLB: 'MLB', NBA: 'NBA',
};

export const SPORT_REGION: Record<Sport, string> = {
  LIGA_MX: 'Fútbol · México', UCL: 'Fútbol · Europa', LALIGA: 'Fútbol · España', NFL: 'Fútbol americano', MLB: 'Béisbol', NBA: 'Baloncesto',
};
