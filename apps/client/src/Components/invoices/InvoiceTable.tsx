// invoices/InvoiceTable.tsx
import { Send, Check, Eye, Trash2, FileText } from 'lucide-react';
import type { Invoice } from './types';
import { EUR, formatDate, calculateInvoiceTotal } from './utils';
import StatusBadge from './StatusBadge';

interface Props {
  invoices: Invoice[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: Invoice['status']) => void;
  onDelete: (id: string) => void;
  onView: (invoice: Invoice) => void;
}

export default function InvoiceTable({ 
  invoices, 
  isLoading, 
  onUpdateStatus, 
  onDelete, 
  onView 
}: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-brikx border border-gray-200 shadow-sm p-8">
        <div className="text-center text-gray-500">Laden...</div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-brikx border border-gray-200 shadow-sm p-8">
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Geen facturen gevonden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-brikx border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Nummer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Klant/Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Datum
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Vervaldatum
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Bedrag
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map(invoice => {
              const total = calculateInvoiceTotal(invoice.items || []);
              
              return (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {invoice.number || `#${invoice.id.slice(0, 8)}`}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {invoice.project?.name || 'Onbekend'}
                    </div>
                    {invoice.project?.client_name && (
                      <div className="text-gray-500">{invoice.project.client_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    {EUR(total)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'sent')}
                          className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Versturen"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          onClick={() => onUpdateStatus(invoice.id, 'paid')}
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Markeer als betaald"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onView(invoice)}
                        className="text-gray-600 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Bekijken"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => {
                            if (confirm('Factuur verwijderen?')) {
                              onDelete(invoice.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
