import 'server-only';
import { db } from './db';
import { isAdmin, type Item, type Member } from './types';

const PUBLIC_COLS = 'id,kind,category,title,summary,details,day,start_time,end_time,location,address,phone,link,due_date,due_time,due_note,need_date,remind_offsets,status,done_at,guest_visible,sort';
const ADMIN_COLS = PUBLIC_COLS + ',price_amount,price_currency,price_note,booking_ref,private_note';

/** Select builder that never returns prices or private fields to guests. */
export function itemsQuery(m: Member) {
  const q = db().from('items').select(isAdmin(m.role) ? ADMIN_COLS : PUBLIC_COLS);
  return isAdmin(m.role) ? q : q.eq('guest_visible', true);
}

export async function getItem(m: Member, id: string): Promise<Item | null> {
  const { data } = await itemsQuery(m).eq('id', id).maybeSingle();
  return (data as unknown as Item) ?? null;
}

export function formatPrice(it: Item) {
  if (it.price_amount == null) return null;
  const n = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(it.price_amount));
  return it.price_currency === '£' ? `${n} £` : `${n} ${it.price_currency || '€'}`;
}

export const CATEGORIES = ['Administratif', 'Avion', 'Vol', 'Aéroport', 'Voiture', 'Déplacement', 'Taxi', 'Hôtel', 'Restaurant', 'Bar', 'Visite', 'Autre'];
