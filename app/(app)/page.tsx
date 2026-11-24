import Link from 'next/link';
import ItemCard from '@/components/ItemCard';
import { requireMember } from '@/lib/auth';
import { itemsQuery } from '@/lib/items';
import { addDays, daysBetween, LongDate, parisNow, TRIP_END, TRIP_START } from '@/lib/dates';
import { isAdmin, type Item } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ jour?: string }> }) {
  const me = await requireMember();
  const admin = isAdmin(me.role);
  const sp = await searchParams;
  const real = parisNow();
  const preview = sp.jour && ISO.test(sp.jour) && sp.jour !== real.date ? sp.jour : null;
  const today = preview ?? real.date;
  const now = preview ? undefined : real.time;

  const [{ data: acts }, { data: tasks }] = await Promise.all([
    itemsQuery(me).eq('kind', 'activite').eq('day', today).order('start_time', { nullsFirst: true }).order('sort'),
    itemsQuery(me).eq('kind', 'tache').neq('status', 'termine').order('due_date', { nullsFirst: false }).order('sort'),
  ]);
  const activities = (acts ?? []) as unknown as Item[];
  const open = (tasks ?? []) as unknown as Item[];
  const dueNow = open.filter(t => (t.due_date && t.due_date <= today) || (!t.due_date && t.need_date && t.need_date <= today));
  const soonLimit = addDays(today, 21);
  const soon = open.filter(t => t.due_date && t.due_date > today && t.due_date <= soonLimit);

  const before = today < TRIP_START, after = today > TRIP_END;
  const dayN = daysBetween(TRIP_START, today) + 1;
  const doneCount = activities.filter(a => a.status === 'termine').length;
  const next = activities.find(a => a.status !== 'termine' && (!now || !a.start_time || a.start_time.slice(0, 5) >= now));

  return (
    <>
      {preview && (
        <div className="banner">
          <span>Aperçu de la journée du {LongDate(preview)}</span>
          <Link className="btn small" href="/">Revenir à aujourd’hui</Link>
        </div>
      )}
      <section className="hero">
        <p className="eyebrow">{LongDate(today, true)}</p>
        {before && <>
          <span className="jx">J-{daysBetween(today, TRIP_START)}</span>
          <h1>Bonjour {me.name}, le départ approche.</h1>
          <div className="stats">
            {admin && <span className="pill">{open.length} tâche{open.length > 1 ? 's' : ''} à faire</span>}
            {admin && soon.length > 0 && <span className="pill">{soon.length} échéance{soon.length > 1 ? 's' : ''} dans les 3 semaines</span>}
          </div>
        </>}
        {!before && !after && <>
          <h1>Jour {dayN} · bonjour {me.name} !</h1>
          <div className="stats">
            <span className="pill">{doneCount} / {activities.length} fait{doneCount > 1 ? 's' : ''}</span>
            {next && <span className="pill">Ensuite : {next.start_time ? next.start_time.slice(0, 5) + ' · ' : ''}{next.title}</span>}
          </div>
        </>}
        {after && <h1>Le voyage est terminé. Slàinte !</h1>}
      </section>

      {dueNow.length > 0 && (
        <section className="section">
          <h2>À faire aujourd’hui <span className="count">{dueNow.length}</span></h2>
          <div className="list">{dueNow.map(t => <ItemCard key={t.id} it={t} today={today} showPrice={admin} />)}</div>
        </section>
      )}

      <section className="section">
        <h2>Programme du jour <span className="count">{activities.length}</span></h2>
        {activities.length
          ? <div className="list">{activities.map(a => <ItemCard key={a.id} it={a} today={today} now={now} showPrice={admin} />)}</div>
          : <p className="empty">Rien de prévu ce jour-là. <Link href="/programme" style={{ color: 'var(--brass)' }}>Voir le programme du voyage</Link></p>}
      </section>

      {soon.length > 0 && (
        <section className="section">
          <h2>Prochaines échéances <span className="count">{soon.length}</span></h2>
          <div className="list">{soon.map(t => <ItemCard key={t.id} it={t} today={today} showPrice={admin} />)}</div>
        </section>
      )}

      <form className="section" action="/" style={{ marginTop: 34 }}>
        <label className="field" style={{ maxWidth: 320 }}>Voir le récapitulatif d’un autre jour
          <span className="row"><input className="input" type="date" name="jour" defaultValue={preview ?? TRIP_START} style={{ flex: 1 }} /><button className="btn small">Voir</button></span>
        </label>
      </form>
    </>
  );
}
