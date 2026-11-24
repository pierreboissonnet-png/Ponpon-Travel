import Link from 'next/link';
import CheckButton from '@/components/CheckButton';
import ItemCard, { catClass } from '@/components/ItemCard';
import StatusSelect from '@/components/StatusSelect';
import { requireMember } from '@/lib/auth';
import { formatPrice, itemsQuery } from '@/lib/items';
import { hhmm, parisNow, shortDate } from '@/lib/dates';
import { isAdmin, STATUS_LABEL, type Item, type Status } from '@/lib/types';

export const dynamic = 'force-dynamic';

const FILTERS: { key: string; label: string }[] = [
  { key: 'ouvert', label: 'À traiter' }, { key: 'a_faire', label: 'À faire' }, { key: 'en_cours', label: 'En cours' }, { key: 'termine', label: 'Terminé' }, { key: 'tous', label: 'Tout' },
];

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ statut?: string; type?: string }> }) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  const sp = await searchParams;
  const statut = FILTERS.some(f => f.key === sp.statut) ? sp.statut! : 'ouvert';
  const { data } = await itemsQuery(me).eq('kind', 'tache').order('sort');
  const all = (data ?? []) as unknown as Item[];
  const types = [...new Set(all.map(t => t.category))];
  const type = sp.type && types.includes(sp.type) ? sp.type : null;
  const list = all.filter(t => (statut === 'tous' || (statut === 'ouvert' ? t.status !== 'termine' : t.status === statut)) && (!type || t.category === type));
  const { date: today } = parisNow();
  const doneN = all.filter(t => t.status === 'termine').length;
  const q = (o: Record<string, string | null>) => '?' + new URLSearchParams(Object.entries({ statut, type, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const total = admin ? list.reduce((s, t) => s + (t.price_currency === '£' ? 0 : Number(t.price_amount || 0)), 0) : 0;

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Avant le départ</p>
        <h1>Préparatifs</h1>
        <p>{doneN} / {all.length} terminé{doneN > 1 ? 's' : ''}</p>
      </div>
      <div className="spread">
        <nav className="filters" aria-label="Statut">
          {FILTERS.map(f => <Link key={f.key} href={q({ statut: f.key })} aria-current={f.key === statut}>{f.label}</Link>)}
        </nav>
        {admin && <Link className="btn small primary" href="/fiche/nouvelle?type=tache">+ Nouvelle tâche</Link>}
      </div>
      <nav className="filters" aria-label="Type" style={{ marginTop: 10 }}>
        <Link href={q({ type: null })} aria-current={!type}>Tous les types</Link>
        {types.map(t => <Link key={t} href={q({ type: t })} aria-current={t === type}>{t}</Link>)}
      </nav>

      <div className="only-desk" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th style={{ width: 44 }}></th><th>Type</th><th>Tâche</th><th>Échéance</th><th>Besoin</th><th>Ressource</th>{admin && <th>Prix</th>}<th>Statut</th></tr></thead>
          <tbody>
            {list.map(t => {
              const late = t.status !== 'termine' && t.due_date && t.due_date < today;
              return (
                <tr key={t.id} className={t.status === 'termine' ? 'done' : ''}>
                  <td><CheckButton id={t.id} done={t.status === 'termine'} label={t.title} /></td>
                  <td><span className={`chip ${catClass(t.category)}`}>{t.category}</span></td>
                  <td className="t"><Link className="t" href={`/fiche/${t.id}`}>{t.title}</Link></td>
                  <td className="small">{t.due_date ? <span className={late ? 'chip late' : ''}>{shortDate(t.due_date)}{t.due_time ? ' ' + hhmm(t.due_time) : ''}</span> : null}{t.due_note && <div className="dim">{t.due_note}</div>}</td>
                  <td className="small">{t.need_date ? shortDate(t.need_date) : ''}</td>
                  <td>{t.link ? <a className="link" href={t.link} target="_blank" rel="noopener noreferrer">{new URL(t.link).hostname.replace('www.', '')}</a> : null}</td>
                  {admin && <td className="small" style={{ whiteSpace: 'nowrap' }}>{formatPrice(t) ?? ''}</td>}
                  <td>{admin ? <StatusSelect id={t.id} status={t.status} /> : <span className={`chip s-${t.status}`}>{STATUS_LABEL[t.status as Status]}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {admin && total > 0 && <p className="dim small" style={{ marginTop: 8 }}>Total affiché (hors montants en £) : {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(total)} €</p>}
      </div>

      <div className="list only-mob" style={{ marginTop: 16 }}>
        {list.map(t => <ItemCard key={t.id} it={t} today={today} showPrice={admin} />)}
      </div>
      {!list.length && <p className="empty" style={{ marginTop: 16 }}>Aucune tâche ici.</p>}
    </>
  );
}
