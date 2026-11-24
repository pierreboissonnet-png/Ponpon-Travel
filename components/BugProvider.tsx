'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBug } from '@/app/actions/bugs';
import { bugCtx, bugShot, installCapture, track, type BugCtx } from '@/lib/bugs-client';

const Ctx = createContext<{ openBug: () => void; busy: boolean }>({ openBug: () => {}, busy: false });
export const useBug = () => useContext(Ctx);

/** Installs error / action capture and provides the "report a problem" sheet everywhere in the app. */
export default function BugProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<{ ctx: BugCtx; shot: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const path = usePathname();

  useEffect(() => { installCapture(); }, []);
  useEffect(() => { track('écran', path); }, [path]);

  const openBug = useCallback(async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    const ctx = bugCtx(), shot = await bugShot();   // screenshot taken at the tap, before the sheet opens
    lock.current = false; setBusy(false);
    setSheet({ ctx, shot });
  }, []);

  useEffect(() => {
    const h = () => openBug();
    addEventListener('ev-bug', h);
    return () => removeEventListener('ev-bug', h);
  }, [openBug]);

  return (
    <Ctx.Provider value={{ openBug, busy }}>
      {children}
      {sheet && <BugSheet {...sheet} onClose={() => setSheet(null)} />}
    </Ctx.Provider>
  );
}

export function BugButton() {
  const { openBug, busy } = useBug();
  return (
    <button type="button" className={`icon-btn${busy ? ' busy' : ''}`} onClick={openBug} disabled={busy} aria-label="Signaler un problème" title="Signaler un problème">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="7.5" y="8" width="9" height="11" rx="4.5" /><path d="M12 8v11M9.5 8a2.5 2.5 0 0 1 5 0M4.5 12h3M16.5 12h3M5 17.5l2.6-1.3M19 17.5l-2.6-1.3M5.5 7.5l2.4 1.6M18.5 7.5l-2.4 1.6" /></svg>
    </button>
  );
}

function BugSheet({ ctx, shot, onClose }: { ctx: BugCtx; shot: string | null; onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [withImg, setWithImg] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState<number | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);

  async function send() {
    if (text.trim().length < 3) { setMsg('Décris le problème en quelques mots.'); return; }
    setBusy(true); setMsg('');
    try {
      const r = await createBug({ text: text.trim(), ctx, img: withImg ? shot : null });
      if (!r.ok) { setMsg(r.error); setBusy(false); return; }
      setDone(r.no);
    } catch (e) {
      setBusy(false);
      setMsg(navigator.onLine === false ? 'Pas de réseau : réessaie une fois connecté (ta description reste dans le champ).' : (e as Error).message || 'Envoi impossible, réessaie.');
    }
  }

  return (
    <div className="sheet-overlay" data-bugsheet-overlay onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="bug-title" data-bugsheet>
        <div className="spread">
          <h2 id="bug-title">Signaler un problème</h2>
          <button className="btn small" onClick={onClose}>Fermer</button>
        </div>
        {done ? (
          <>
            <p className="ok">Merci ! Signalement n°{done} transmis aux organisateurs.</p>
            <div className="row">
              <button className="btn primary" onClick={() => { onClose(); router.push(`/signalements/${done}`); }}>Voir le suivi</button>
              <button className="btn" onClick={onClose}>Fermer</button>
            </div>
          </>
        ) : (
          <>
            <p className="small muted">Un bouton qui ne répond pas, un horaire faux, un affichage bizarre ? Décris-le : les organisateurs recevront ta description, la capture de l’écran et les informations techniques utiles.</p>
            <p className="small">Écran : <b>{ctx.ecran}</b>{ctx.erreurs.length ? <span style={{ color: 'var(--red)' }}> · {ctx.erreurs.length} erreur(s) technique(s) détectée(s)</span> : null}</p>
            <label className="field">Que se passe-t-il ?
              <textarea className="input" rows={5} maxLength={2000} autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="Ex. : la case ne se coche pas, l’heure du vol est fausse, le texte dépasse de l’écran…" />
            </label>
            {shot ? (
              <>
                <label className="checkrow"><input type="checkbox" checked={withImg} onChange={e => setWithImg(e.target.checked)} /> Joindre la capture de l’écran (prise au moment du clic)</label>
                {withImg && <img src={shot} alt="Capture de l’écran signalé" className="bug-shot" />}
              </>
            ) : <p className="small muted">La capture d’écran n’a pas pu être réalisée sur cet appareil : ta description sera envoyée seule.</p>}
            {msg && <p className="error" role="alert">{msg}</p>}
            <div className="row">
              <button className="btn primary" style={{ flex: 1 }} onClick={send} disabled={busy}>{busy ? 'Envoi…' : 'Envoyer'}</button>
              <button className="btn" onClick={onClose}>Annuler</button>
            </div>
            <p className="dim small">Aucun tarif ni code de réservation n’est joint.</p>
          </>
        )}
      </div>
    </div>
  );
}
