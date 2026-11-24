export type Role = 'superadmin' | 'admin' | 'guest';
export type Status = 'a_faire' | 'en_cours' | 'termine';

export interface Member { id: string; name: string; role: Role }

export interface Item {
  id: string;
  kind: 'activite' | 'tache';
  category: string;
  title: string;
  summary: string | null;
  details: string | null;
  day: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  phone: string | null;
  link: string | null;
  due_date: string | null;
  due_time: string | null;
  due_note: string | null;
  need_date: string | null;
  remind_offsets: number[];
  status: Status;
  done_at: string | null;
  guest_visible: boolean;
  sort: number;
  // admins only (absent for guests)
  price_amount?: number | null;
  price_currency?: string | null;
  price_note?: string | null;
  booking_ref?: string | null;
  private_note?: string | null;
}

export interface Conversation {
  id: string;
  created_by: string;
  subject: string;
  urgency: 1 | 2 | 3;
  status: 'ouvert' | 'pris_en_compte' | 'clos';
  acked_by: string | null;
  acked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message { id: string; conversation_id: string; author_id: string | null; body: string; created_at: string }

export const isAdmin = (r: Role) => r === 'admin' || r === 'superadmin';

export const ROLE_LABEL: Record<Role, string> = { superadmin: 'Super admin', admin: 'Admin', guest: 'Invité' };
export const STATUS_LABEL: Record<Status, string> = { a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminé' };
export const URGENCY: Record<1 | 2 | 3, { label: string; hint: string }> = {
  1: { label: 'Urgent', hint: 'Notification toutes les 2 minutes jusqu’à la prise en charge' },
  2: { label: 'Important', hint: 'Notification toutes les heures jusqu’à la prise en charge' },
  3: { label: 'Info', hint: 'Une seule notification' },
};
