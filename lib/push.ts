import 'server-only';
import webpush from 'web-push';
import { db } from './db';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  /** keeps the notification on screen until it is tapped (urgent chats) */
  sticky?: boolean;
}

let ready = false;
function setup() {
  if (ready) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', pub, priv);
  ready = true;
  return true;
}

/** Sends to every device of the given members. Dead subscriptions are removed. Returns devices reached. */
export async function pushTo(memberIds: string[], payload: PushPayload): Promise<number> {
  if (!memberIds.length || !setup()) return 0;
  const { data: subs } = await db().from('push_subscriptions').select('id,endpoint,p256dh,auth').in('member_id', memberIds);
  if (!subs?.length) return 0;
  const body = JSON.stringify(payload);
  let ok = 0;
  await Promise.all(subs.map(async s => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 3600, urgency: payload.sticky ? 'high' : 'normal' });
      ok++;
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db().from('push_subscriptions').delete().eq('id', s.id);
      else console.error('push failed', code);
    }
  }));
  return ok;
}

export async function adminIds(): Promise<string[]> {
  const { data } = await db().from('members').select('id').in('role', ['admin', 'superadmin']);
  return (data ?? []).map(r => r.id);
}

export async function pushToAdmins(payload: PushPayload, exceptId?: string) {
  return pushTo((await adminIds()).filter(id => id !== exceptId), payload);
}
