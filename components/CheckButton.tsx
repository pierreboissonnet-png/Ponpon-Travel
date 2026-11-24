'use client';
import { useOptimistic, useTransition } from 'react';
import { setDone } from '@/app/actions/items';
import { IconCheck } from './Icons';

export default function CheckButton({ id, done, label }: { id: string; done: boolean; label: string }) {
  const [optimistic, setOptimistic] = useOptimistic(done);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="check"
      role="checkbox"
      aria-checked={optimistic}
      aria-label={(optimistic ? 'Marquer comme non fait : ' : 'Marquer comme fait : ') + label}
      disabled={pending}
      onClick={() => start(async () => { setOptimistic(!optimistic); await setDone(id, !optimistic); })}
    >
      <IconCheck />
    </button>
  );
}
