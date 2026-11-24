'use client';
import { useActionState } from 'react';
import { addMember, resetCode, type CodeResult } from '@/app/actions/members';

function Result({ r }: { r: CodeResult }) {
  if (!r) return null;
  if (r.error) return <p className="error">{r.error}</p>;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p className="ok">Code de {r.name} (à lui transmettre, il ne sera plus affiché) :</p>
      <div className="code-box">{r.code}</div>
    </div>
  );
}

export function AddMemberForm() {
  const [r, action, pending] = useActionState<CodeResult, FormData>(addMember, null);
  return (
    <form action={action} className="form">
      <div className="grid2">
        <label className="field">Prénom<input className="input" name="name" required maxLength={40} /></label>
        <label className="field">Profil
          <select className="input" name="role" defaultValue="guest">
            <option value="guest">Invité (pas de tarifs)</option>
            <option value="admin">Admin (voit les tarifs, reçoit les alertes)</option>
            <option value="superadmin">Super admin (gère les participants)</option>
          </select>
        </label>
      </div>
      <button className="btn primary" disabled={pending}>Ajouter et générer un code</button>
      <Result r={r} />
    </form>
  );
}

export function ResetCodeForm({ id }: { id: string }) {
  const [r, action, pending] = useActionState<CodeResult, FormData>(resetCode, null);
  return (
    <form action={action} style={{ display: 'grid', gap: 8 }}>
      <input type="hidden" name="id" value={id} />
      <button className="btn small" disabled={pending}>Nouveau code</button>
      <Result r={r} />
    </form>
  );
}
