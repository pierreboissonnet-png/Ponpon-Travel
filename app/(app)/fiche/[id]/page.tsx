import Link from 'next/link';
import { notFound } from 'next/navigation';
import CheckButton from '@/components/CheckButton';
import StatusSelect from '@/components/StatusSelect';
import { catClass } from '@/components/ItemCard';
import { IconBack } from '@/components/Icons';
import { requireMember } from '@/lib/auth';
import { formatPrice, getItem } from '@/lib/items';
import { hhmm, LongDate, shortDate } from '@/lib/dates';
import { isAdmin, STATUS_LABEL } from '@/lib/types';

export const dynamic = 'force-dynamic';

const REMIND = (n: number) => (n === 0 ? 'le jour même' : `J-${n}`);

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const it = await getItem(me, id);
  if (!it) notFound();
  const done = it.status === 'termine';
  const back = it.kind === 'tache' ? '/preparatifs' : `/programme?jour=${it.day}`;
  const price = admin ? formatPrice(it) : null;
  const maps = it.address || it.location;

  return (
    <article className="detail">
      <Link className="back" href={back}><IconBack /> {it.kind === 'tache' ? 'Préparatifs' : 'Programme'}</Link>
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="row">
          <span className={`chip ${catClass(it.category)}`}>{it.category}</span>
          <span className={`chip s-${it.status}`}>{STATUS_LABEL[it.status]}</span>
          {admin && !it.guest_visible && <span className="chip">Caché aux invités</span>}
        </div>
        <h1>{it.title}</h1>
        {it.summary && <p className="muted" style={{ fontSize: '1.05rem' }}>{it.summary}</p>}
      </div>

      <div className="donebar">
        <CheckButton id={it.id} done={done} label={it.title} />
        <span style={{ flex: 1 }}>{done ? 'C’est fait' : 'Marquer comme fait'}</span>
        {admin && it.kind === 'tache' && <StatusSelect id={it.id} status={it.status} />}
      </div>

      <dl className="facts">
        {it.day && <div><dt>Quand</dt><dd>{LongDate(it.day)}{it.start_time ? ` · ${hhmm(it.start_time)}` : ''}{it.end_time ? ` – ${hhmm(it.end_time)}` : ''}</dd></div>}
        {it.location && <div><dt>Lieu</dt><dd>{it.location}</dd></div>}
        {it.address && <div><dt>Adresse</dt><dd>{it.address}</dd></div>}
        {maps && <div><dt>Itinéraire</dt><dd><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(maps)}`} target="_blank" rel="noopener noreferrer">Ouvrir dans Maps</a></dd></div>}
        {it.phone && <div><dt>Téléphone</dt><dd><a href={`tel:${it.phone.replace(/[^\d+]/g, '')}`}>{it.phone}</a></dd></div>}
        {it.link && <div><dt>Lien</dt><dd><a href={it.link} target="_blank" rel="noopener noreferrer">{it.link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}</a></dd></div>}
        {it.due_date && <div><dt>Échéance</dt><dd>{LongDate(it.due_date, true)}{it.due_time ? ` à ${hhmm(it.due_time)}` : ''}</dd></div>}
        {it.due_note && <div><dt>{it.due_date ? 'Note' : 'Échéance'}</dt><dd>{it.due_note}</dd></div>}
        {it.need_date && <div><dt>Besoin</dt><dd>{shortDate(it.need_date)}</dd></div>}
        {admin && it.due_date && <div><dt>Alertes</dt><dd>{it.remind_offsets.length ? it.remind_offsets.map(REMIND).join(', ') : 'aucune'}</dd></div>}
      </dl>

      {it.details && <p className="prose">{it.details}</p>}

      {admin && (price || it.price_note || it.booking_ref || it.private_note) && (
        <section className="private">
          <h2>Réservé aux organisateurs</h2>
          <dl className="facts" style={{ background: 'rgba(0,0,0,.15)' }}>
            {price && <div><dt>Tarif</dt><dd>{price}</dd></div>}
            {it.price_note && <div><dt>Détail</dt><dd>{it.price_note}</dd></div>}
            {it.booking_ref && <div><dt>Réservation</dt><dd>{it.booking_ref}</dd></div>}
            {it.private_note && <div><dt>Note</dt><dd className="prose">{it.private_note}</dd></div>}
          </dl>
        </section>
      )}

      {admin && <div className="row"><Link className="btn" href={`/fiche/${it.id}/modifier`}>Modifier la fiche</Link></div>}
    </article>
  );
}
