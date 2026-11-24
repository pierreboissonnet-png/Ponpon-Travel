'use client';
import { useEffect, useState } from 'react';

const b64ToBytes = (s: string) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

type State = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';

export default function PushSetup({ vapid }: { vapid: string }) {
  const [state, setState] = useState<State>('loading');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setState(ios && !standalone ? 'ios-install' : 'unsupported'); return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      if (Notification.permission === 'denied') { setState('denied'); return; }
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? 'on' : 'off');
      if (sub) fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) }).catch(() => {});
    })().catch(() => setState('unsupported'));
  }, []);

  const enable = async () => {
    setBusy(true); setMsg(null);
    try {
      if (!vapid) throw new Error('Clé VAPID absente de la configuration.');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapid) });
      const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      if (!r.ok) throw new Error('Enregistrement refusé par le serveur.');
      setState('on'); setMsg('Notifications activées sur cet appareil.');
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const disable = async () => {
    setBusy(true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setState('off'); setBusy(false); setMsg(null);
  };
  const test = async () => {
    setBusy(true);
    const r = await fetch('/api/push/test', { method: 'POST' }).then(r => r.json()).catch(() => ({ devices: 0 }));
    setMsg(r.devices ? 'Notification envoyée : elle doit arriver dans quelques secondes.' : 'Aucun appareil abonné trouvé.');
    setBusy(false);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {state === 'loading' && <p className="muted">Vérification…</p>}
      {state === 'ios-install' && (
        <div className="private">
          <h2>Sur iPhone</h2>
          <p>Les notifications ne marchent que depuis l’app installée :</p>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4 }}>
            <li>Ouvre ce site dans <b>Safari</b>.</li>
            <li>Touche le bouton <b>Partager</b>, puis <b>Sur l’écran d’accueil</b>.</li>
            <li>Ouvre l’app <b>Écosse 2027</b> depuis l’écran d’accueil et reviens ici.</li>
          </ol>
        </div>
      )}
      {state === 'unsupported' && <p className="muted">Ce navigateur ne gère pas les notifications.</p>}
      {state === 'denied' && <p className="error">Les notifications sont bloquées. Autorise-les dans les réglages du téléphone (Notifications › Écosse 2027), puis reviens ici.</p>}
      {state === 'off' && <button className="btn primary" onClick={enable} disabled={busy}>Activer les notifications</button>}
      {state === 'on' && (
        <div className="row">
          <span className="chip s-termine">Activées sur cet appareil</span>
          <button className="btn small" onClick={test} disabled={busy}>Envoyer un test</button>
          <button className="btn small" onClick={disable} disabled={busy}>Désactiver</button>
        </div>
      )}
      {msg && <p className="small muted" role="status">{msg}</p>}
    </div>
  );
}
