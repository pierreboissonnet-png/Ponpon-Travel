import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';
import { timeAgo } from '@/lib/dates';
import { isAdmin, URGENCY, type Conversation } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATE: Record<Conversation['status'], string> = { ouvert: 'En attente', pris_en_compte: 'Pris en charge', clos: 'Clos' };

export default async function MessagesPage() {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  let q = db().from('conversations').select('id,created_by,subject,urgency,status,acked_by,acked_at,created_at,updated_at').order('updated_at', { ascending: false }).limit(100);
  if (!admin) q = q.eq('created_by', me.id);
  const { data } = await q;
  const convs = ((data ?? []) as Conversation[]).sort((a, b) => (a.status === 'ouvert' ? 0 : 1) - (b.status === 'ouvert' ? 0 : 1) || (a.status === 'ouvert' ? a.urgency - b.urgency : 0));
  const { data: members } = await db().from('members').select('id,name');
  const name = (id: string | null) => members?.find(m => m.id === id)?.name ?? '—';

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Messages</p>
        <h1>{admin ? 'Demandes des voyageurs' : 'Contacter l’organisateur'}</h1>
        <p>{admin ? 'Les demandes en attente sont en haut. Une demande urgente sonne toutes les 2 minutes tant que personne ne l’a prise en charge.' : 'Un souci, une question ? Écris aux organisateurs et choisis le degré d’urgence.'}</p>
      </div>
      <div className="row"><Link className="btn primary" href="/messages/nouveau">+ Nouvelle demande</Link></div>
      <div className="list" style={{ marginTop: 18 }}>
        {convs.map(c => (
          <Link key={c.id} href={`/messages/${c.id}`} className={`convo${c.status === 'ouvert' ? ' open-' + c.urgency : ''}`}>
            <span className="top">
              <b>{c.subject}</b>
              <span className={`chip u${c.urgency}`}>{URGENCY[c.urgency].label}</span>
            </span>
            <span className="small muted">
              {admin ? `${name(c.created_by)} · ` : ''}{STATE[c.status]}{c.acked_by ? ` par ${name(c.acked_by)}` : ''} · {timeAgo(c.updated_at)}
            </span>
          </Link>
        ))}
        {!convs.length && <p className="empty">Aucune conversation pour l’instant.</p>}
      </div>
    </>
  );
}
