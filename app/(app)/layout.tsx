import Link from 'next/link';
import NavLinks from '@/components/NavLinks';
import BugProvider, { BugButton } from '@/components/BugProvider';
import { requireMember } from '@/lib/auth';
import { db } from '@/lib/db';
import { isAdmin, ROLE_LABEL } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  // admins: conversations not yet taken into account · guests: none
  let unread = 0;
  if (admin) {
    const { count } = await db().from('conversations').select('id', { count: 'exact', head: true }).eq('status', 'ouvert');
    unread = count ?? 0;
  }
  const { count: guestTasks } = await db().from('items').select('id', { count: 'exact', head: true }).eq('kind', 'tache').eq('guest_visible', true);
  return (
    <BugProvider>
      <header className="topbar">
        <Link href="/" className="brand">
          <img src="/icon-64.png" alt="" />
          <span>Écosse 2027<small>12 – 16 mai</small></span>
        </Link>
        <span className="top-actions">
          <span className="who">{me.name} · <span className="chip">{ROLE_LABEL[me.role]}</span></span>
          <BugButton />
        </span>
      </header>
      <NavLinks showTasks={admin || (guestTasks ?? 0) > 0} unread={unread} />
      <main className="shell">{children}</main>
    </BugProvider>
  );
}
