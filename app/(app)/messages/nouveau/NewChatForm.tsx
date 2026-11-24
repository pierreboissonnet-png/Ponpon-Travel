'use client';
import { useActionState } from 'react';
import { createConversation } from '@/app/actions/chat';
import { URGENCY } from '@/lib/types';

export default function NewChatForm() {
  const [error, action, pending] = useActionState(createConversation, null);
  return (
    <form action={action} className="form">
      <fieldset>
        <legend>Degré d’urgence</legend>
        <div className="urg">
          {([3, 2, 1] as const).map(u => (
            <label key={u} className={`u${u}`}>
              <input type="radio" name="urgency" value={u} defaultChecked={u === 3} required />
              <b>{u} · {URGENCY[u].label}</b>
              <small>{URGENCY[u].hint}</small>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">Sujet<input className="input" name="subject" maxLength={120} required placeholder="Ex. : la voiture ne démarre pas" /></label>
      <label className="field">Message<textarea className="input" name="body" maxLength={4000} required /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? 'Envoi…' : 'Envoyer aux organisateurs'}</button>
    </form>
  );
}
