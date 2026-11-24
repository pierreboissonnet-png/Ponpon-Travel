export const TZ = 'Europe/Paris';
export const TRIP_START = '2027-05-12';
export const TRIP_END = '2027-05-16';

/** Current local date and time in Paris: { date: 'YYYY-MM-DD', time: 'HH:MM' } */
export function parisNow(d = new Date()) {
  const s = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  const [date, time] = s.split(' ');
  return { date, time };
}

export function addDays(date: string, n: number) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / 864e5);
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', ...o });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** 'jeudi 13 mai' */
export function longDate(date: string, withYear = false) {
  return fmt({ weekday: 'long', day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) }).format(new Date(date + 'T12:00:00Z'));
}
export const LongDate = (date: string, y = false) => cap(longDate(date, y));

/** '13/05/2027' */
export function shortDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

/** 'Jeu. 13' */
export function tabDate(date: string) {
  const w = fmt({ weekday: 'short' }).format(new Date(date + 'T12:00:00Z'));
  return `${cap(w)} ${Number(date.slice(8, 10))}`;
}

export const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : '');

export function relDay(n: number) {
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'demain';
  if (n === -1) return 'hier';
  return n > 0 ? `dans ${n} jours` : `il y a ${-n} jours`;
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}
