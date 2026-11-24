import Link from 'next/link';
import { IconBack } from '@/components/Icons';
import { changeRole, removeMember } from '@/app/actions/members';
import { requireSuperadmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ROLE_LABEL, type Member } from '@/lib/types';
import { AddMemberForm, ResetCodeForm } from './CodeForms';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const me = await requireSuperadmin();
  const { data } = await db().from('members').select('id,name,role').order('created_at');
  const members = (data ?? []) as Member[];
  const { data: subs } = await db().from('push_subscriptions').select('member_id');
  const devices = (id: string) => (subs ?? []).filter(s => s.member_id === id).length;
  return (
    <div className="detail">
      <Link className="back" href="/reglages"><IconBack /> Réglages</Link>
      <div className="page-head" style={{ padding: 0 }}>
        <p className="eyebrow">Super admin</p>
        <h1>Participants</h1>
        <p>Chacun se connecte avec son code à 6 chiffres. Les invités ne voient ni les tarifs, ni les réservations, ni les tâches cachées.</p>
      </div>
      <div className="list">
        {members.map(m => (
          <div key={m.id} className="convo" style={{ gap: 10 }}>
            <div className="top">
              <b>{m.name}{m.id === me.id ? ' (moi)' : ''}</b>
              <span className="small dim">{devices(m.id)} appareil{devices(m.id) > 1 ? 's' : ''} avec notifications</span>
            </div>
            <div className="row">
              <form action={changeRole} className="row">
                <input type="hidden" name="id" value={m.id} />
                <select className="input" name="role" defaultValue={m.role} style={{ width: 'auto', padding: '7px 10px' }} aria-label={`Profil de ${m.name}`}>
                  {(['guest', 'admin', 'superadmin'] as const).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <button className="btn small">Changer</button>
              </form>
              {m.id !== me.id && <form action={removeMember}><input type="hidden" name="id" value={m.id} /><button className="btn small danger">Retirer</button></form>}
            </div>
            <ResetCodeForm id={m.id} />
          </div>
        ))}
      </div>
      <section className="section">
        <h2>Ajouter un participant</h2>
        <AddMemberForm />
      </section>
    </div>
  );
}
