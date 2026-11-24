import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconBack } from '@/components/Icons';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';
import { BUG_COLS, BUG_ST, bugDate, type Bug } from '@/lib/bugs';
import { isAdmin } from '@/lib/types';
import { BugAdminForm, BugThread, DownloadShot } from './BugClient';

export const dynamic = 'force-dynamic';

const LBL: Record<string, string> = { version: 'Version', ecran: 'Écran', route: 'Adresse', ecranTaille: 'Taille d’écran', installee: 'Appli installée', reseau: 'Réseau', notifications: 'Notifications', appareil: 'Appareil', heureLocale: 'Heure (téléphone)' };

export default async function BugPage({ params }: { params: Promise<{ no: string }> }) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  const no = Number((await params).no);
  if (!Number.isInteger(no) || no < 1) notFound();
  const { data } = await db().from('bug_reports').select(BUG_COLS + ',img').eq('no', no).maybeSingle();
  const b = data as unknown as Bug | null;
  if (!b || (!admin && b.member_id !== me.id)) notFound();
  const { data: comments } = await db().from('bug_comments').select('id,pseudo,text,img,from_admin,created_at').eq('bug_id', b.id).order('created_at');
  const c = b.ctx || {};
  const s = BUG_ST[b.status] ?? BUG_ST.new;

  return (
    <article className="detail">
      <Link className="back" href="/signalements"><IconBack /> Signalements</Link>
      <div style={{ display: 'grid', gap: 8 }}>
        <div className="row"><span className={`chip ${s[1]}`}>{s[0]}</span><span className="small muted">{bugDate(b.created_at)} · <b>{b.pseudo}</b></span></div>
        <h1>Signalement n°{b.no}</h1>
      </div>
      <p className="prose" style={{ padding: 14, borderRadius: 'var(--r)', background: 'var(--surface)', border: '1px solid var(--line)' }}>{b.text}</p>
      {b.img ? <div style={{ display: 'grid', gap: 8 }}><img src={b.img} alt="Capture de l’écran" className="bug-shot" /><DownloadShot img={b.img} name={`signalement_${b.no}.jpg`} /></div> : <p className="small muted">Pas de capture.</p>}

      {admin && b.analysis && <section className="private"><h2>Diagnostic de Claude</h2><p className="prose small">{b.analysis}</p></section>}

      <section className="section" style={{ marginTop: 6 }}>
        <h2>Contexte</h2>
        <dl className="facts">{Object.entries(LBL).filter(([k]) => c[k]).map(([k, l]) => <div key={k}><dt>{l}</dt><dd className="small">{String(c[k])}</dd></div>)}</dl>
        {!!c.erreurs?.length && <details><summary>Erreurs techniques ({c.erreurs.length})</summary><pre className="mono">{c.erreurs.map(e => `${e.t} [${e.type}] ${e.msg}${e.src ? ' @' + e.src : ''}${e.stack ? '\n' + e.stack : ''}`).join('\n')}</pre></details>}
        {!!c.actions?.length && <details><summary>Dernières actions ({c.actions.length})</summary><pre className="mono">{c.actions.map(a => `${a.t} ${a.k} : ${a.v}`).join('\n')}</pre></details>}
      </section>

      <section className="section">
        <h2>Note de suivi</h2>
        {admin ? <BugAdminForm no={b.no} status={b.status} note={b.note ?? ''} /> : <p className="prose small" style={{ padding: 14, borderRadius: 'var(--r)', background: 'var(--surface)' }}>{b.note || 'Pas encore de réponse.'}</p>}
        {b.updated_by && <p className="dim small">Dernière mise à jour par {b.updated_by} le {bugDate(b.updated_at)}</p>}
      </section>

      <section className="section">
        <h2>Échanges</h2>
        <BugThread no={b.no} admin={admin} comments={(comments ?? []).map(x => ({ ...x, when: bugDate(x.created_at) }))} />
      </section>
    </article>
  );
}
