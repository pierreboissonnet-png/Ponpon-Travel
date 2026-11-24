import Link from 'next/link';
import { notFound } from 'next/navigation';
import ItemForm from '@/components/ItemForm';
import { IconBack } from '@/components/Icons';
import { requireAdmin } from '@/lib/auth';
import { getItem } from '@/lib/items';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const it = await getItem(me, id);
  if (!it) notFound();
  return (
    <div className="detail">
      <Link className="back" href={`/fiche/${id}`}><IconBack /> Retour à la fiche</Link>
      <h1>Modifier la fiche</h1>
      <ItemForm it={it} kind={it.kind} />
    </div>
  );
}
