import Link from 'next/link';
import ItemCard from '@/components/ItemCard';
import { requireMember } from '@/lib/auth';
import { itemsQuery } from '@/lib/items';
import { LongDate, parisNow, tabDate, TRIP_START } from '@/lib/dates';
import { isAdmin, type Item } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ProgrammePage({ searchParams }: { searchParams: Promise<{ jour?: string }> }) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  const { data } = await itemsQuery(me).eq('kind', 'activite').not('day', 'is', null).order('day').order('start_time', { nullsFirst: true }).order('sort');
  const all = (data ?? []) as unknown as Item[];
  const days = [...new Set(all.map(a => a.day as string))];
  const { date: today, time: now } = parisNow();
  const sp = await searchParams;
  const day = sp.jour && days.includes(sp.jour) ? sp.jour : days.includes(today) ? today : days[0] ?? TRIP_START;
  const list = all.filter(a => a.day === day);
  const done = list.filter(a => a.status === 'termine').length;

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">Le programme</p>
        <h1>{LongDate(day)}</h1>
        <p>{list.length} étape{list.length > 1 ? 's' : ''}{done ? ` · ${done} faite${done > 1 ? 's' : ''}` : ''}</p>
      </div>
      <nav className="daytabs" aria-label="Jours du voyage">
        {days.map((d, i) => (
          <Link key={d} href={`/programme?jour=${d}`} aria-current={d === day ? 'page' : undefined} scroll={false}>
            <span>Jour {i + 1}</span><b>{tabDate(d)}</b>
          </Link>
        ))}
      </nav>
      <div className="list" style={{ marginTop: 10 }}>
        {list.map(a => <ItemCard key={a.id} it={a} today={today} now={day === today ? now : undefined} showPrice={admin} />)}
        {!list.length && <p className="empty">Aucune activité ce jour-là.</p>}
      </div>
      {admin && (
        <div className="row" style={{ marginTop: 18 }}>
          <Link className="btn" href={`/fiche/nouvelle?type=activite&jour=${day}`}>+ Ajouter une activité</Link>
        </div>
      )}
    </>
  );
}
