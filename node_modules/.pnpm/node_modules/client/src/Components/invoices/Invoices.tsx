// invoices/Invoices.tsx
import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { 
  useInvoices, 
  useProjects, 
  usePhases, 
  useUnbilledEntries,
  useUpdateInvoiceStatus,
  useDeleteInvoice 
} from './hooks';
import { calculateStatus } from './utils';
import InvoiceStats from './InvoiceStats';
import InvoiceFilters from './InvoiceFilters';
import InvoiceTable from './InvoiceTable';
import CreateInvoiceModal from './CreateInvoiceModal';
import type { FilterStatus, Invoice } from './types';

export default function Invoices() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Queries
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: projects = [] } = useProjects();
  const { data: phases = [] } = usePhases();
  const { data: unbilledEntries = [] } = useUnbilledEntries();

  // Mutations
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .map(inv => ({ ...inv, status: calculateStatus(inv) }))
      .filter(inv => filterStatus === 'all' || inv.status === filterStatus)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [invoices, filterStatus]);

  // Handlers
  const handleUpdateStatus = (id: string, status: Invoice['status']) => {
    updateStatus.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    deleteInvoice.mutate(id);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // TODO: Open detail modal
  };

  return (
    <div className="min-h-screen bg-brikx-bg">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brikx-dark">Facturen</h1>
            <p className="text-gray-600 mt-1">
              Beheer je facturen en betalingen
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-brikx-teal hover:bg-brikx-teal-dark text-white px-6 py-2.5 rounded-brikx font-semibold shadow-lg hover:shadow-brikx transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nieuwe Factuur
          </button>
        </div>

        {/* Stats */}
        <InvoiceStats invoices={invoices} />

        {/* Filters */}
        <InvoiceFilters 
          filterStatus={filterStatus} 
          setFilterStatus={setFilterStatus} 
        />

        {/* Table */}
        <InvoiceTable
          invoices={filteredInvoices}
          isLoading={loadingInvoices}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          onView={handleView}
        />

        {/* Create Modal */}
        {showCreateModal && (
          <CreateInvoiceModal
            projects={projects}
            phases={phases}
            unbilledEntries={unbilledEntries}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
}