'use client';
import { useEffect } from 'react';
import { logError } from '@/lib/bugs-client';

/** Shown when a screen crashes: lets the traveller report it straight away. */
export default function ScreenError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { logError(error.message || 'Erreur d’affichage', { stack: error.stack?.slice(0, 700), src: error.digest }); }, [error]);
  return (
    <div className="detail">
      <h1>Oups, cet écran a planté</h1>
      <p className="muted">Signale-le en un clic : la capture et les détails techniques partent avec ton message.</p>
      <div className="row">
        <button className="btn primary" onClick={() => dispatchEvent(new Event('ev-bug'))}>Signaler le bug</button>
        <button className="btn" onClick={reset}>Réessayer</button>
        <a className="btn" href="/">Aujourd’hui</a>
      </div>
    </div>
  );
}
