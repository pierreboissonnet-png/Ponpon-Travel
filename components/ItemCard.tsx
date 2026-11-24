import Link from 'next/link';
import CheckButton from './CheckButton';
import { formatPrice } from '@/lib/items';
import { hhmm, relDay, shortDate } from '@/lib/dates';
import type { Item } from '@/lib/types';

export const catClass = (c: string) => 'c-' + c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace('administratif', 'admin').replace(/[^a-z]/g, '');

/** One programme activity or task, as a tappable card with a "done" checkbox. */
export default function ItemCard({ it, today, now, showPrice, showDay }: { it: Item; today?: string; now?: string; showPrice?: boolean; showDay?: boolean }) {
  const done = it.status === 'termine';
  const isTask = it.kind === 'tache';
  const late = isTask && !done && !!it.due_date && !!today && it.due_date < today;
  const current = !done && !!now && !!today && it.day === today && !!it.start_time && hhmm(it.start_time) <= now && (!it.end_time || hhmm(it.end_time) > now);
  const price = showPrice ? formatPrice(it) : null;
  const dueIn = isTask && it.due_date && today ? Math.round((Date.parse(it.due_date) - Date.parse(today)) / 864e5) : null;
  return (
    <article className={`card${done ? ' done' : ''}${late ? ' late' : ''}${current ? ' now' : ''}`}>
      {it.start_time ? <span className="time">{hhmm(it.start_time)}</span> : <span className="time notime" aria-hidden="true" />}
      <div className="body">
        <p className="title"><Link href={`/fiche/${it.id}`}>{it.title}</Link></p>
        {it.summary && <p className="sub">{it.summary}</p>}
        <div className="meta">
          <span className={`chip ${catClass(it.category)}`}>{it.category}</span>
          {showDay && it.day && <span className="chip">{shortDate(it.day)}</span>}
          {isTask && it.due_date && <span className={`chip${late ? ' late' : ''}`}>Échéance {shortDate(it.due_date)}{it.due_time ? ' ' + hhmm(it.due_time) : ''}{dueIn !== null && !done ? ` · ${relDay(dueIn)}` : ''}</span>}
          {isTask && !it.due_date && it.due_note && <span className="chip">{it.due_note}</span>}
          {current && <span className="chip price">En ce moment</span>}
          {price && <span className="chip price">{price}</span>}
        </div>
      </div>
      <CheckButton id={it.id} done={done} label={it.title} />
    </article>
  );
}
