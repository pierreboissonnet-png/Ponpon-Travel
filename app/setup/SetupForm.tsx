'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { createSuperadmin, type SetupState } from './actions';

export default function SetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(createSuperadmin, null);
  if (state?.code) return (
    <div className="form">
      <p className="ok">Compte super admin créé pour {state.name}.</p>
      <p className="muted">Ton code de connexion (note-le, il ne sera plus affiché) :</p>
      <div className="code-box">{state.code}</div>
      <Link className="btn primary" href="/login">Se connecter</Link>
    </div>
  );
  return (
    <form action={action} className="form">
      <label className="field">Clé d’installation (variable SETUP_KEY)
        <input className="input" name="key" required autoComplete="off" />
      </label>
      <label className="field">Ton prénom
        <input className="input" name="name" required defaultValue="Pierre" />
      </label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn primary" disabled={pending}>Créer le super admin</button>
    </form>
  );
}
