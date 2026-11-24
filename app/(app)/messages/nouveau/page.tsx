import Link from 'next/link';
import { IconBack } from '@/components/Icons';
import { requireMember } from '@/lib/auth';
import NewChatForm from './NewChatForm';

export const dynamic = 'force-dynamic';

export default async function NewChatPage() {
  await requireMember();
  return (
    <div className="detail">
      <Link className="back" href="/messages"><IconBack /> Messages</Link>
      <h1>Nouvelle demande</h1>
      <NewChatForm />
    </div>
  );
}
