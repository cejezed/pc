// invoices/InvoiceStats.tsx
import React, { useMemo } from 'react';
import type { Invoice } from './types';
import { EUR, calculateStatus, calculateInvoiceTotal } from './utils';

interface Props {
  invoices: Invoice[];
}

export default function InvoiceStats({ invoices }: Props) {
  const stats = useMemo(() => {
    const invoicesWithStatus = invoices.map(inv => ({ 
      ...inv, 
      status: calculateStatus(inv) 
    }));

    const outstanding = invoicesWithStatus
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + calculateInvoiceTotal(inv.items || []), 0);

    const thisMonth = new Date();
    const receivedThisMonth = invoicesWithStatus
      .filter(inv => {
        if (inv.status !== 'paid') return false;
        const invDate = new Date(inv.issue_date);
        return invDate.getMonth() === thisMonth.getMonth() && 
               invDate.getFullYear() === thisMonth.getFullYear();
      })
      .reduce((sum, inv) => sum + calculateInvoiceTotal(inv.items || []), 0);

    return { outstanding, receivedThisMonth };
  }, [invoices]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm">
        <div className="text-sm text-gray-600 mb-2">Te ontvangen (openstaand)</div>
        <div className="text-3xl font-bold text-brikx-dark">{EUR(stats.outstanding)}</div>
      </div>
      <div className="bg-white rounded-brikx border border-gray-200 p-6 shadow-sm">
        <div className="text-sm text-gray-600 mb-2">Ontvangen deze maand</div>
        <div className="text-3xl font-bold text-green-600">{EUR(stats.receivedThisMonth)}</div>
      </div>
    </div>
  );
}