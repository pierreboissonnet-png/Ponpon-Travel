import Link from 'next/link';
import PushSetup from '@/components/PushSetup';
import { logout } from '@/app/login/actions';
import { requireMember } from '@/lib/auth';
import { isAdmin, ROLE_LABEL } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const me = await requireMember();
  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Réglages</p>
        <h1>{me.name}</h1>
        <p>Profil : {ROLE_LABEL[me.role]}</p>
      </div>
      <section className="section">
        <h2>Notifications</h2>
        <p className="muted small">{isAdmin(me.role)
          ? 'Indispensable pour être prévenu des demandes des voyageurs et des échéances à venir. À activer sur chaque appareil.'
          : 'Pour être prévenu quand un organisateur te répond.'}</p>
        <PushSetup vapid={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''} />
      </section>
      {me.role === 'superadmin' && (
        <section className="section">
          <h2>Administration</h2>
          <div className="row"><Link className="btn" href="/admin/membres">Gérer les participants et leurs codes</Link></div>
        </section>
      )}
      <section className="section">
        <h2>Session</h2>
        <form action={logout}><button className="btn danger small">Se déconnecter</button></form>
      </section>
    </>
  );
}
