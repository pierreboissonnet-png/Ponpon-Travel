import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IconBack } from '@/components/Icons';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';
import { isAdmin, URGENCY, type Conversation } from '@/lib/types';
import ChatRoom from './ChatRoom';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await db().from('conversations').select('*').eq('id', id).maybeSingle();
  const conv = data as Conversation | null;
  if (!conv || (!isAdmin(me.role) && conv.created_by !== me.id)) notFound();
  const [{ data: msgs }, { data: members }] = await Promise.all([
    db().from('messages').select('id,author_id,body,created_at').eq('conversation_id', id).order('created_at'),
    db().from('members').select('id,name'),
  ]);
  const names = Object.fromEntries((members ?? []).map(m => [m.id, m.name]));
  return (
    <div className="chat">
      <div className="chat-head">
        <Link className="back" href="/messages"><IconBack /> Messages</Link>
        <div className="spread">
          <h1 style={{ fontSize: '1.3rem' }}>{conv.subject}</h1>
          <span className={`chip u${conv.urgency}`}>{URGENCY[conv.urgency].label}</span>
        </div>
        <p className="small dim">Ouverte par {names[conv.created_by] ?? '—'}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr) auto', minHeight: 0 }}>
        <ChatRoom id={id} meId={me.id} admin={isAdmin(me.role)} names={names} initial={msgs ?? []} initialStatus={conv.status} />
      </div>
    </div>
  );
}
