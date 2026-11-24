'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { ackConversation, closeConversation, sendMessage } from '@/app/actions/chat';

type Msg = { id: string; author_id: string | null; body: string; created_at: string };
type Conv = { status: 'ouvert' | 'pris_en_compte' | 'clos' };

const t = (iso: string) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(new Date(iso));

export default function ChatRoom({ id, meId, admin, names, initial, initialStatus }: {
  id: string; meId: string; admin: boolean; names: Record<string, string>; initial: Msg[]; initialStatus: Conv['status'];
}) {
  const [msgs, setMsgs] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/chat/${id}`, { cache: 'no-store' });
        if (!r.ok || !alive) return;
        const d = await r.json();
        setMsgs(d.messages); setStatus(d.conv.status);
      } catch { /* offline: try again next tick */ }
    };
    const timer = setInterval(poll, 4000);
    document.addEventListener('visibilitychange', poll);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', poll); };
  }, [id]);

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  const refresh = async () => { const r = await fetch(`/api/chat/${id}`, { cache: 'no-store' }); if (r.ok) { const d = await r.json(); setMsgs(d.messages); setStatus(d.conv.status); } };
  const send = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    setMsgs(m => [...m, { id: 'tmp' + Date.now(), author_id: meId, body, created_at: new Date().toISOString() }]);
    start(async () => { await sendMessage(id, body); await refresh(); });
  };

  return (
    <>
      <div className="row" style={{ paddingBottom: 6 }}>
        <span className={`chip ${status === 'ouvert' ? 'late' : status === 'clos' ? '' : 's-termine'}`}>{status === 'ouvert' ? 'En attente de prise en charge' : status === 'clos' ? 'Close' : 'Prise en charge'}</span>
        {admin && status === 'ouvert' && <button className="btn small primary" disabled={pending} onClick={() => start(async () => { await ackConversation(id); await refresh(); })}>Je m’en occupe</button>}
        {status !== 'clos' && <button className="btn small" disabled={pending} onClick={() => start(async () => { await closeConversation(id); await refresh(); })}>Clore</button>}
      </div>
      <div className="msgs" aria-live="polite">
        {msgs.map(m => m.author_id === null
          ? <p key={m.id} className="msg sys">{m.body}</p>
          : <div key={m.id} className={`msg${m.author_id === meId ? ' me' : ''}`}>{m.body}<small>{m.author_id === meId ? 'Moi' : names[m.author_id] ?? '—'} · {t(m.created_at)}</small></div>)}
        <div ref={end} />
      </div>
      {status !== 'clos' && (
        <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
          <textarea className="input" value={text} onChange={e => setText(e.target.value)} placeholder="Écrire un message…" rows={1} maxLength={4000}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); send(); } }} />
          <button className="btn primary" disabled={!text.trim()}>Envoyer</button>
        </form>
      )}
    </>
  );
}
