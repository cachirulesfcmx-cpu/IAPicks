import { TIME_ZONE, localDayKey } from '@/lib/format';

const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE });
const shortDay = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TIME_ZONE });
const longDate = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE });
const hourFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: TIME_ZONE });

export const kickoffTime = (iso: string) => timeFmt.format(new Date(iso));

/** "Hoy", "Mañana" or a short date, in Mexico City time. */
export function kickoffDay(iso: string, now = new Date()): string {
  const k = localDayKey(iso);
  if (k === localDayKey(now.toISOString())) return 'Hoy';
  if (k === localDayKey(new Date(now.getTime() + 86_400_000).toISOString())) return 'Mañana';
  return shortDay.format(new Date(iso)).replace('.', '');
}

export function startsIn(iso: string, now = new Date()): string {
  const min = Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);
  if (min <= 0) return 'Comenzado';
  if (min < 60) return `en ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `en ${h} h${min % 60 && h < 10 ? ` ${min % 60} min` : ''}`;
  return `en ${Math.round(h / 24)} días`;
}

export function greeting(now = new Date()): string {
  const h = Number(hourFmt.format(now)) % 24;
  if (h < 6) return 'Buenas noches';
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export const todayLabel = (now = new Date()) => longDate.format(now);
