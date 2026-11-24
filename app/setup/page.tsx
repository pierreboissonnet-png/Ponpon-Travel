import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const { count } = await db().from('members').select('id', { count: 'exact', head: true }).eq('role', 'superadmin');
  if ((count ?? 0) > 0) redirect('/login');
  return (
    <div className="login">
      <div className="login-card">
        <div style={{ display: 'grid', gap: 6 }}>
          <p className="eyebrow">Première installation</p>
          <h1>Créer le super admin</h1>
          <p className="muted">Cette page ne sert qu’une fois. Elle disparaît dès que le super admin existe.</p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
