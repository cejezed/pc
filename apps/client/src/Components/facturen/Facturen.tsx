import React, { useState, useMemo } from "react";
import { Plus, Search, Filter, Calendar, Loader2 } from "lucide-react";
import {
  useInvoices,
  useOverdueInvoices,
  useDeleteInvoice,
  parseDate,
} from "./hooks";
import { KPICard, centsToMoney } from "./basis-componenten";
import { InvoicesTable } from "./factuur-tabel-componenten";
import { CreateInvoiceModal } from "./factuur-wizard-componenten";
import { InvoiceDetailDrawer } from "./factuur-detail-componenten";
import type { Invoice } from "./types";

export default function FacturenPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: overdueList = [] } = useOverdueInvoices();
  const deleteMutation = useDeleteInvoice();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | Invoice["status"]>("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [search, setSearch] = useState("");

  // KPI's
  const kpis = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const sentOrOverdue = invoices.filter((i) => 
      ["sent", "overdue"].includes(i.status)
    );
    const teOntvangen = sentOrOverdue.reduce(
      (acc, i) => acc + i.amount_cents, 
      0
    );

    const ontvangenDezeMaand = invoices
      .filter(
        (i) =>
          i.status === "paid" &&
          parseDate(i.payment_date)?.getMonth() === month &&
          parseDate(i.payment_date)?.getFullYear() === year
      )
      .reduce((acc, i) => acc + i.amount_cents, 0);

    const openstaand = invoices
      .filter((i) => ["draft", "sent", "overdue"].includes(i.status))
      .reduce((acc, i) => acc + i.amount_cents, 0);

    return { teOntvangen, ontvangenDezeMaand, openstaand };
  }, [invoices]);

  const handleDelete = async (inv: Invoice) => {
    if (!confirm(`Factuur ${inv.invoice_number} verwijderen?`)) return;
    await deleteMutation.mutateAsync(inv.id);
    alert("Verwijderd.");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Facturen</h1>
          <p className="text-gray-600 text-sm">
            Beheer facturen, stuur ze per e-mail, exporteer PDF's en registreer betalingen.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-3 py-2 hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nieuwe factuur
        </button>
      </div>

      {/* KPI's */}
      <div className="grid sm:grid-cols-3 gap-3">
        <KPICard
          label="Te ontvangen (sent + overdue)"
          value={centsToMoney(kpis.teOntvangen)}
        />
        <KPICard
          label="Ontvangen deze maand"
          value={centsToMoney(kpis.ontvangenDezeMaand)}
        />
        <KPICard
          label="Openstaand totaal"
          value={centsToMoney(kpis.openstaand)}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[220px]">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Search className="h-4 w-4" /> Zoeken
          </div>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2"
            placeholder="Nummer/klant/project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        
        <label>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Status
          </div>
          <select
            className="mt-1 border rounded-xl px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="all">Alle</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        
        <label>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Van
          </div>
          <input
            type="date"
            className="mt-1 border rounded-xl px-3 py-2"
            value={dateRange.from}
            onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value }))}
          />
        </label>
        
        <label>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Tot
          </div>
          <input
            type="date"
            className="mt-1 border rounded-xl px-3 py-2"
            value={dateRange.to}
            onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value }))}
          />
        </label>
        
        {!!overdueList.length && (
          <div className="ml-auto">
            <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-3 py-2 text-sm">
              🔔 {overdueList.length} overdue
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
          Facturen laden…
        </div>
      ) : (
        <InvoicesTable
          invoices={invoices}
          filterStatus={filterStatus}
          search={search}
          dateRange={dateRange}
          onRowClick={setSelectedInvoice}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <CreateInvoiceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => {
          setShowCreateModal(false);
          const inv = invoices.find((x) => x.id === id);
          if (inv) setSelectedInvoice(inv);
        }}
      />

      <InvoiceDetailDrawer
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
}
