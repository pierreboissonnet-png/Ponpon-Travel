// Bug reports, browser side (same principle as Hyrox Coach):
// screenshot taken at the moment of the tap, technical context, JavaScript errors and last actions.
export const APP_VERSION = '1.1.0';

type Err = { t: string; type: string; msg: string; src?: string; stack?: string };
type Act = { t: string; k: string; v: string };
const errs: Err[] = [], trail: Act[] = [];
const push = <T,>(arr: T[], max: number, item: T) => { arr.push(item); if (arr.length > max) arr.shift(); };
const hhmmss = () => new Date().toLocaleTimeString('fr-FR');

export function installCapture() {
  const w = window as unknown as { __evCapture?: boolean };
  if (w.__evCapture) return;
  w.__evCapture = true;
  addEventListener('error', e => push(errs, 20, { t: hhmmss(), type: 'erreur', msg: String(e.message).slice(0, 300), src: (e.filename || '').split('/').pop() + ':' + e.lineno + ':' + e.colno, stack: e.error ? String(e.error.stack).slice(0, 700) : undefined }));
  addEventListener('unhandledrejection', e => push(errs, 20, { t: hhmmss(), type: 'promesse', msg: String((e.reason && (e.reason.message || e.reason)) || 'rejet').slice(0, 300), stack: e.reason?.stack ? String(e.reason.stack).slice(0, 700) : undefined }));
  const ce = console.error.bind(console);
  console.error = (...a: unknown[]) => { push(errs, 20, { t: hhmmss(), type: 'console', msg: a.map(x => x instanceof Error ? x.message : typeof x === 'string' ? x : safe(x)).join(' ').slice(0, 300) }); ce(...a); };
  // last actions (buttons and links touched) to help reproduce the bug
  document.addEventListener('click', e => {
    const b = (e.target as Element)?.closest?.('button, a, [role=button], [role=checkbox], input[type=checkbox], select');
    if (!b || b.closest('[data-bugsheet]')) return;
    const label = (b.getAttribute('aria-label') || b.textContent || (b as HTMLInputElement).name || b.tagName).replace(/\s+/g, ' ').trim().slice(0, 50);
    if (label) track('clic', label);
  }, true);
}
const safe = (x: unknown) => { try { return JSON.stringify(x); } catch { return String(x); } };
export const track = (k: string, v: string) => push(trail, 30, { t: hhmmss(), k, v: String(v).slice(0, 80) });
export const logError = (msg: string, extra: Partial<Err> = {}) => push(errs, 20, { t: hhmmss(), type: 'app', msg: String(msg).slice(0, 300), ...extra });

const SCREENS: Record<string, string> = { '': 'Aujourd’hui', programme: 'Programme', preparatifs: 'Préparatifs', fiche: 'Fiche', messages: 'Messages', reglages: 'Réglages', admin: 'Administration', signalements: 'Signalements' };
export function screenName() {
  const [a, b, c] = location.pathname.replace(/^\//, '').split('/');
  const sub = a === 'fiche' ? (b === 'nouvelle' ? 'nouvelle' : c === 'modifier' ? 'modifier' : 'détail') : a === 'messages' && b ? (b === 'nouveau' ? 'nouveau' : 'conversation') : a === 'admin' ? b : '';
  const title = document.querySelector('main h1')?.textContent?.trim().slice(0, 60);
  return [SCREENS[a || ''] ?? a, sub, title].filter(Boolean).join(' › ');
}

export type BugCtx = Record<string, unknown> & { ecran: string; erreurs: Err[]; actions: Act[] };
/** Context attached to the report */
export function bugCtx(): BugCtx {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    version: APP_VERSION, ecran: screenName(), route: location.pathname + location.search,
    ecranTaille: `${innerWidth}×${innerHeight} px (×${Math.round((devicePixelRatio || 1) * 100) / 100})`,
    installee: (matchMedia('(display-mode: standalone)').matches || nav.standalone) ? 'oui' : 'non',
    reseau: navigator.onLine === false ? 'hors ligne' : 'en ligne',
    notifications: 'Notification' in window ? Notification.permission : 'non gérées',
    appareil: navigator.userAgent.slice(0, 220), heureLocale: new Date().toLocaleString('fr-FR'),
    erreurs: errs.slice(-10), actions: trail.slice(-15),
  };
}

/** Screenshot of the visible screen (html2canvas, loaded on demand); null when impossible */
export async function bugShot(): Promise<string | null> {
  const run = async () => {
    const { default: h2c } = await import('html2canvas');
    const bg = getComputedStyle(document.body).backgroundColor;
    const cv = await h2c(document.body, {
      backgroundColor: bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : '#0a0e0d', x: scrollX, y: scrollY, width: innerWidth, height: innerHeight,
      windowWidth: document.documentElement.clientWidth, windowHeight: innerHeight, scale: Math.min(2, devicePixelRatio || 1),
      useCORS: true, logging: false, imageTimeout: 2500,
      ignoreElements: el => !!el.matches?.('[data-bugsheet-overlay]'),
      onclone: doc => { const st = doc.createElement('style'); st.textContent = '*{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'; doc.head.appendChild(st); },
    });
    const w = Math.min(720, cv.width), h = Math.round(cv.height * w / cv.width), c2 = document.createElement('canvas');
    c2.width = w; c2.height = h; c2.getContext('2d')!.drawImage(cv, 0, 0, w, h);
    let url = c2.toDataURL('image/jpeg', 0.72); if (url.length > 850000) url = c2.toDataURL('image/jpeg', 0.45);
    return url.length > 890000 ? null : url;
  };
  try { return await Promise.race([run(), new Promise<null>(r => setTimeout(() => r(null), 9000))]); }
  catch (e) { console.warn('Capture impossible :', (e as Error)?.message); return null; }
}

/** Resizes a picked image file into a JPEG data URL under ~900 KB */
export function fileToJpeg(f: File): Promise<string | null> {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const w = Math.min(900, im.width), c = document.createElement('canvas');
      c.width = w; c.height = Math.round(im.height * w / im.width); c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      let u = c.toDataURL('image/jpeg', 0.7); if (u.length > 880000) u = c.toDataURL('image/jpeg', 0.45);
      res(u.length < 890000 ? u : null);
    };
    im.onerror = () => res(null);
    im.src = URL.createObjectURL(f);
  });
}

export function download(blob: Blob, name: string) {
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
}
