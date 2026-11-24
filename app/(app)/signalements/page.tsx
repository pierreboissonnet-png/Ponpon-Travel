import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';
import { BUG_COLS, BUG_ST, bugDate, type Bug } from '@/lib/bugs';
import { isAdmin } from '@/lib/types';
import BugsToolbar from './BugsToolbar';

export const dynamic = 'force-dynamic';

const FILTERS: [string, string][] = [['open', 'À traiter'], ['new', 'Nouveaux'], ['doing', 'En cours'], ['done', 'Résolus'], ['all', 'Tous']];
const norm = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default async function BugsPage({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  const sp = await searchParams;
  const f = FILTERS.some(([k]) => k === sp.f) ? sp.f! : 'open';
  const q = (sp.q || '').slice(0, 80);
  let query = db().from('bug_reports').select(BUG_COLS).order('no', { ascending: false }).limit(500);
  if (!admin) query = query.eq('member_id', me.id);
  const { data } = await query;
  const all = (data ?? []) as Bug[];
  const { data: counts } = await db().from('bug_comments').select('bug_id');
  const nComments = (id: string) => (counts ?? []).filter(c => c.bug_id === id).length;
  const inF = (b: Bug, k: string) => k === 'all' || (k === 'open' ? ['new', 'doing'].includes(b.status) : b.status === k);
  const list = all.filter(b => inF(b, f) && (!q || norm([b.no, '#' + b.no, b.pseudo, b.text, b.ctx?.ecran, b.ctx?.version].join(' ')).includes(norm(q))));
  type Cfg = { off?: boolean; last?: string; n?: number };
  const cfg: Cfg | null = admin ? (((await db().from('app_config').select('value').eq('key', 'bugapi').maybeSingle()).data?.value as Cfg | undefined) ?? null) : null;
  const href = (o: Record<string, string>) => '?' + new URLSearchParams({ f, ...(q ? { q } : {}), ...o }).toString();

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Signalements</p>
        <h1>{admin ? 'Les problèmes signalés' : 'Mes signalements'}</h1>
        <p>{admin ? 'Avec la capture de l’écran et le contexte technique. Visible des seuls organisateurs.' : 'Tes signalements et leur suivi. Le bouton 🐞 en haut de l’écran en crée un nouveau.'}</p>
      </div>
      {admin && <BugsToolbar filter={f} q={q} apiOff={!!cfg?.off} apiLast={cfg?.last ? bugDate(cfg.last) + ` (${cfg.n || 0} appels)` : null} keyConfigured={(process.env.BUG_API_KEY || '').length >= 32} />}
      <nav className="filters" aria-label="Filtrer" style={{ marginTop: 12 }}>
        {FILTERS.map(([k, l]) => <Link key={k} href={href({ f: k })} aria-current={k === f}>{l} ({all.filter(b => inF(b, k)).length})</Link>)}
      </nav>
      <form className="row" style={{ marginTop: 10 }}>
        <input type="hidden" name="f" value={f} />
        <input className="input search" type="search" name="q" defaultValue={q} placeholder="Rechercher : n°, personne, écran, mot…" style={{ flex: 1 }} />
        <button className="btn small">Chercher</button>
      </form>
      <div className="list" style={{ marginTop: 14 }}>
        {list.map(b => {
          const s = BUG_ST[b.status] ?? BUG_ST.new, n = nComments(b.id);
          return (
            <Link key={b.id} href={`/signalements/${b.no}`} className="convo">
              <span className="top"><b><span className="dim">#{b.no}</span> {b.text.slice(0, 90)}{b.text.length > 90 ? '…' : ''}</b><span className={`chip ${s[1]}`}>{s[0]}</span></span>
              <span className="small muted">{bugDate(b.created_at)} · {b.pseudo} · {b.ctx?.ecran ?? ''}{b.has_img ? ' · capture' : ''}{b.analysis ? ' · diagnostic' : ''}{n ? ` · ${n} échange(s)` : ''}{!admin && b.note ? ' · réponse' : ''}</span>
            </Link>
          );
        })}
        {!list.length && <p className="empty">Aucun signalement.</p>}
      </div>
    </>
  );
}
