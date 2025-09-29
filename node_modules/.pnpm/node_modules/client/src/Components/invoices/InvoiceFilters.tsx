// invoices/InvoiceFilters.tsx
import React from 'react';
import type { FilterStatus } from './types';

interface Props {
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
}

const filters: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Alles' },
  { value: 'draft', label: 'Concept' },
  { value: 'sent', label: 'Verstuurd' },
  { value: 'paid', label: 'Betaald' },
  { value: 'overdue', label: 'Verlopen' },
];

export default function InvoiceFilters({ filterStatus, setFilterStatus }: Props) {
  return (
    <div className="bg-white rounded-brikx border border-gray-200 p-4 shadow-sm">
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === value
                ? 'bg-brikx-teal text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}