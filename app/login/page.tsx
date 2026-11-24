import { redirect } from 'next/navigation';
import { currentMember } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await currentMember()) redirect('/');
  return (
    <div className="login">
      <div className="login-card">
        <img src="/icon-192.png" alt="" width={64} height={64} style={{ borderRadius: 16 }} />
        <div style={{ display: 'grid', gap: 6 }}>
          <p className="eyebrow">12 – 16 mai 2027</p>
          <h1>Écosse 2027</h1>
          <p className="muted">Saisis le code à 6 chiffres que l’organisateur t’a donné.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
