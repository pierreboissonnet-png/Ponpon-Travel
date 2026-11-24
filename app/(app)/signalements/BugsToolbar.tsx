'use client';
import { useTransition } from 'react';
import { setBugApiOff } from '@/app/actions/bugs';

export default function BugsToolbar({ filter, q, apiOff, apiLast, keyConfigured }: { filter: string; q: string; apiOff: boolean; apiLast: string | null; keyConfigured: boolean }) {
  const [pending, start] = useTransition();
  const qs = new URLSearchParams({ f: filter, ...(q ? { q } : {}) }).toString();
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="private small">
        <p><b>Suivi avec Claude</b> : {!keyConfigured ? 'clé BUG_API_KEY non configurée dans Vercel.' : <>accès API {apiOff ? <b style={{ color: 'var(--red)' }}>coupé</b> : <b>actif</b>}{apiLast ? ' · dernier accès ' + apiLast : ' · jamais utilisé'}. Claude lit les signalements, met à jour leur statut et leur note de suivi.</>}</p>
        {keyConfigured && <div><button className="btn small" disabled={pending} onClick={() => start(() => setBugApiOff(!apiOff))}>{apiOff ? 'Rétablir l’accès' : 'Couper l’accès'}</button></div>}
      </div>
      <div className="row">
        <a className="btn small" href={`/api/bugs/export?format=csv&${qs}`}>Exporter (CSV)</a>
        <a className="btn small" href={`/api/bugs/export?format=json&${qs}`}>Exporter avec captures</a>
      </div>
    </div>
  );
}
