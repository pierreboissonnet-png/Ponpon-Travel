'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addBugComment, deleteBug, updateBug } from '@/app/actions/bugs';
import { download, fileToJpeg } from '@/lib/bugs-client';
import { BUG_ST } from '@/lib/bugs';

export function DownloadShot({ img, name }: { img: string; name: string }) {
  return <div><button className="btn small" onClick={async () => download(await (await fetch(img)).blob(), name)}>Télécharger la capture</button></div>;
}

export function BugAdminForm({ no, status, note }: { no: number; status: string; note: string }) {
  const router = useRouter();
  const [st, setSt] = useState(status), [n, setN] = useState(note), [conf, setConf] = useState(false), [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <div className="form">
      <div className="filters" role="group" aria-label="Statut">
        {Object.entries(BUG_ST).map(([k, [l]]) => <a key={k} href="#" role="button" aria-current={st === k} onClick={e => { e.preventDefault(); setSt(k); }}>{l}</a>)}
      </div>
      <textarea className="input" rows={3} maxLength={1000} value={n} onChange={e => setN(e.target.value)} placeholder="Analyse, correction prévue, version…" />
      {msg && <p className="ok">{msg}</p>}
      <div className="row">
        <button className="btn primary" disabled={pending} onClick={() => start(async () => { await updateBug(no, st, n); setMsg('Signalement mis à jour.'); router.refresh(); })}>Enregistrer</button>
        <button className="btn danger" disabled={pending} onClick={() => { if (!conf) { setConf(true); return; } start(async () => { await deleteBug(no); router.push('/signalements'); }); }}>{conf ? 'Confirmer la suppression' : 'Supprimer'}</button>
      </div>
    </div>
  );
}

type C = { id: string; pseudo: string; text: string; img: string | null; from_admin: boolean; when: string };

/** The reporter adds details (text, screenshot), the team answers. A reporter's message puts the report back to "Nouveau". */
export function BugThread({ no, admin, comments }: { no: number; admin: boolean; comments: C[] }) {
  const router = useRouter();
  const [t, setT] = useState(''), [img, setImg] = useState<string | null>(null), [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {comments.length > 0 && (
        <div className="thread">
          {comments.map(c => (
            <div key={c.id} className={`msg${c.from_admin === admin ? ' me' : ''}`}>
              {c.text}
              {c.img && <img src={c.img} alt="Capture jointe" />}
              <small>{c.from_admin ? 'Organisateurs' : c.pseudo} · {c.when}</small>
            </div>
          ))}
        </div>
      )}
      <textarea className="input" rows={3} maxLength={2000} value={t} onChange={e => setT(e.target.value)} placeholder={admin ? 'Répondre…' : 'Apporter une précision : ce qui gêne, où, ce que tu attendais…'} />
      <div className="row">
        <label className="btn small" style={{ cursor: 'pointer' }}>
          {img ? 'Capture jointe ✓' : 'Joindre une capture'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (f) setImg(await fileToJpeg(f)); }} />
        </label>
        {img && <button className="btn small" onClick={() => setImg(null)}>Retirer</button>}
        <span style={{ flex: 1 }} />
        <button className="btn primary small" disabled={pending || !t.trim()} onClick={() => start(async () => {
          await addBugComment(no, t.trim(), img); setT(''); setImg(null);
          setMsg(admin ? 'Réponse envoyée.' : 'Précision envoyée : le signalement repasse en « Nouveau ».'); router.refresh();
        })}>{pending ? 'Envoi…' : 'Envoyer'}</button>
      </div>
      {msg && <p className="small muted" role="status">{msg}</p>}
    </div>
  );
}
