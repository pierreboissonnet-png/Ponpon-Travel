import ItemForm from '@/components/ItemForm';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function NewItemPage({ searchParams }: { searchParams: Promise<{ type?: string; jour?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const kind = sp.type === 'tache' ? 'tache' : 'activite';
  const day = sp.jour && /^\d{4}-\d{2}-\d{2}$/.test(sp.jour) ? sp.jour : undefined;
  return (
    <div className="detail">
      <h1>{kind === 'tache' ? 'Nouvelle tâche' : 'Nouvelle activité'}</h1>
      <ItemForm kind={kind} day={day} />
    </div>
  );
}
