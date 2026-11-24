import { deleteItem, saveItem } from '@/app/actions/items';
import { CATEGORIES } from '@/lib/items';
import { hhmm } from '@/lib/dates';
import type { Item } from '@/lib/types';

const OFFSETS = [30, 14, 7, 3, 1, 0];

/** Create / edit form for an activity or a task (admins only). */
export default function ItemForm({ it, kind, day }: { it?: Item; kind: 'activite' | 'tache'; day?: string }) {
  const v = (k: keyof Item) => (it?.[k] ?? '') as string;
  const reminders = it ? it.remind_offsets : kind === 'tache' ? [7, 1, 0] : [];
  return (
    <>
      <form action={saveItem} className="form">
        {it && <input type="hidden" name="id" value={it.id} />}
        <fieldset>
          <legend>Fiche</legend>
          <div className="grid2">
            <label className="field">Type de fiche
              <select className="input" name="kind" defaultValue={it?.kind ?? kind}>
                <option value="activite">Activité du programme</option>
                <option value="tache">Tâche de préparation</option>
              </select>
            </label>
            <label className="field">Catégorie
              <input className="input" name="category" list="cats" defaultValue={it?.category ?? (kind === 'tache' ? 'Administratif' : 'Visite')} required />
              <datalist id="cats">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
            </label>
          </div>
          <label className="field">Titre<input className="input" name="title" defaultValue={v('title')} required /></label>
          <label className="field">Résumé (une ligne)<input className="input" name="summary" defaultValue={v('summary')} /></label>
          <label className="field">Détails<textarea className="input" name="details" defaultValue={v('details')} /></label>
          <div className="grid2">
            <label className="field">Statut
              <select className="input" name="status" defaultValue={it?.status ?? 'a_faire'}>
                <option value="a_faire">À faire</option><option value="en_cours">En cours</option><option value="termine">Terminé</option>
              </select>
            </label>
            <label className="checkrow" style={{ alignSelf: 'end', paddingBottom: 10 }}>
              <input type="checkbox" name="guest_visible" defaultChecked={it ? it.guest_visible : kind === 'activite'} /> Visible par les invités
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Programme</legend>
          <div className="grid2">
            <label className="field">Jour<input className="input" type="date" name="day" defaultValue={it?.day ?? day ?? ''} /></label>
            <label className="field">Début<input className="input" type="time" name="start_time" defaultValue={hhmm(it?.start_time)} /></label>
            <label className="field">Fin<input className="input" type="time" name="end_time" defaultValue={hhmm(it?.end_time)} /></label>
          </div>
          <div className="grid2">
            <label className="field">Lieu<input className="input" name="location" defaultValue={v('location')} /></label>
            <label className="field">Adresse<input className="input" name="address" defaultValue={v('address')} /></label>
            <label className="field">Téléphone<input className="input" name="phone" type="tel" defaultValue={v('phone')} /></label>
          </div>
          <label className="field">Lien / ressource<input className="input" name="link" type="url" defaultValue={v('link')} placeholder="https://" /></label>
        </fieldset>

        <fieldset>
          <legend>Échéance et alertes</legend>
          <div className="grid2">
            <label className="field">Échéance<input className="input" type="date" name="due_date" defaultValue={v('due_date')} /></label>
            <label className="field">Heure<input className="input" type="time" name="due_time" defaultValue={hhmm(it?.due_time)} /></label>
            <label className="field">Besoin pour le<input className="input" type="date" name="need_date" defaultValue={v('need_date')} /></label>
          </div>
          <label className="field">Note d’échéance (ex. « Optionnel », « ASAP »)<input className="input" name="due_note" defaultValue={v('due_note')} /></label>
          <div style={{ display: 'grid', gap: 8 }}>
            <span className="small muted">M’alerter (notification aux organisateurs, à 9 h)</span>
            <div className="row">
              {OFFSETS.map(o => (
                <label key={o} className="checkrow"><input type="checkbox" name="remind" value={o} defaultChecked={reminders.includes(o)} /> {o === 0 ? 'Jour J' : `J-${o}`}</label>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Réservé aux organisateurs</legend>
          <div className="grid2">
            <label className="field">Tarif<input className="input" name="price_amount" inputMode="decimal" defaultValue={it?.price_amount ?? ''} /></label>
            <label className="field">Devise
              <select className="input" name="price_currency" defaultValue={it?.price_currency ?? '€'}><option>€</option><option>£</option></select>
            </label>
            <label className="field">N° de réservation<input className="input" name="booking_ref" defaultValue={it?.booking_ref ?? ''} /></label>
          </div>
          <label className="field">Détail du tarif<input className="input" name="price_note" defaultValue={it?.price_note ?? ''} /></label>
          <label className="field">Note privée (codes, contacts…)<textarea className="input" name="private_note" defaultValue={it?.private_note ?? ''} /></label>
        </fieldset>

        <div className="row"><button className="btn primary">Enregistrer</button></div>
      </form>
      {it && (
        <form action={deleteItem} className="row" style={{ marginTop: 22 }}>
          <input type="hidden" name="id" value={it.id} />
          <input type="hidden" name="kind" value={it.kind} />
          <button className="btn danger small">Supprimer cette fiche</button>
        </form>
      )}
    </>
  );
}
