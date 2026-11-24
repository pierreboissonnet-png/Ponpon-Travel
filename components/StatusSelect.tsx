'use client';
import { useTransition } from 'react';
import { setStatus } from '@/app/actions/items';
import { STATUS_LABEL, type Status } from '@/lib/types';

export default function StatusSelect({ id, status }: { id: string; status: Status }) {
  const [pending, start] = useTransition();
  return (
    <select
      className={`status-select s-${status}`}
      value={status}
      disabled={pending}
      aria-label="Statut"
      onChange={e => { const v = e.target.value as Status; start(() => setStatus(id, v)); }}
    >
      {(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  );
}
