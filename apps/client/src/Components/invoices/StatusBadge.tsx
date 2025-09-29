// invoices/StatusBadge.tsx
import React from 'react';
import type { Invoice } from './types';

interface Props {
  status: Invoice['status'];
}

export default function StatusBadge({ status }: Props) {
  const config = {
    draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Concept' },
    sent: { color: 'bg-blue-100 text-blue-800', label: 'Verstuurd' },
    paid: { color: 'bg-green-100 text-green-800', label: 'Betaald' },
    overdue: { color: 'bg-red-100 text-red-800', label: 'Verlopen' },
  };

  const { color, label } = config[status];

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${color}`}>
      {label}
    </span>
  );
}