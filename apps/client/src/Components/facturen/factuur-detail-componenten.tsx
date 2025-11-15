import React, { useState } from "react";
import {
  X,
  Download,
  Mail,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Edit,
} from "lucide-react";
import {
  StatusBadge,
  Pill,
  TimelineDot,
  centsToMoney,
} from "./basis-componenten";
import {
  useSendInvoice,
  useMarkPaid,
  useCancelInvoice,
  useCreateCreditNote,
  fmtDate,
  ymd,
} from "./hooks";
import type { Invoice } from "./types";

export function InvoiceDetailDrawer({
  invoice,
  onClose,
  onEdit,
}: {
  invoice: Invoice | null;
  onClose: () => void;
  onEdit?: (invoice: Invoice) => void;
}) {
  const [working, setWorking] = useState(false);

  const sendMutation = useSendInvoice();
  const markPaidMutation = useMarkPaid();
  const cancelMutation = useCancelInvoice();
  const creditMutation = useCreateCreditNote();

  if (!invoice) return null;

  const doSend = async () => {
    setWorking(true);
    try {
      await sendMutation.mutateAsync(invoice.id);
      alert("Factuur verzonden.");
    } finally {
      setWorking(false);
    }
  };

  const doMarkPaid = async () => {
    const d = prompt("Betaaldatum (YYYY-MM-DD)", ymd(new Date()));
    if (!d) return;

    setWorking(true);
    try {
      await markPaidMutation.mutateAsync({
        id: invoice.id,
        payment_date: d,
      });
      alert("Gemarkeerd als betaald.");
    } finally {
      setWorking(false);
    }
  };

  const doCancel = async () => {
    if (!confirm("Weet je zeker dat je deze factuur wilt annuleren?")) return;

    setWorking(true);
    try {
      await cancelMutation.mutateAsync(invoice.id);
      alert("Factuur geannuleerd.");
    } finally {
      setWorking(false);
    }
  };

  const doCredit = async () => {
    if (!confirm("Creditnota aanmaken op basis van deze factuur?")) return;

    setWorking(true);
    try {
      await creditMutation.mutateAsync(invoice.id);
      alert("Creditnota aangemaakt.");
    } finally {
      setWorking(false);
    }
  };

  const pdfUrl = `/api/invoices/${invoice.id}/pdf`;

  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex justify-end">
      <div className="w-full sm:max-w-lg bg-white h-full overflow-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="space-y-0.5">
            <h3 className="text-lg font-semibold">
              Factuur {invoice.invoice_number}
            </h3>
            <div className="text-sm text-gray-600">
              {invoice.project?.name} — {invoice.project?.client_name}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Quick info */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={invoice.status} />
            <Pill>Datum: {fmtDate(invoice.invoice_date)}</Pill>
            <Pill>Vervalt: {fmtDate(invoice.due_date)}</Pill>
            <Pill>Bedrag: {centsToMoney(invoice.amount_cents)}</Pill>
          </div>

          {/* Status timeline */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 font-medium">Status</div>
            <div className="p-4 space-y-2">
              <TimelineDot active={true} label="Draft aangemaakt" />
              <TimelineDot
                active={["sent", "paid", "overdue"].includes(invoice.status)}
                label="Verzonden"
              />
              <TimelineDot
                active={invoice.status === "paid"}
                label="Betaald"
                date={invoice.payment_date}
              />
              <TimelineDot
                active={invoice.status === "overdue"}
                label="Achterstallig"
              />
              <TimelineDot
                active={invoice.status === "cancelled"}
                label="Geannuleerd"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 font-medium">Regels</div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-white border-b">
                    <th className="text-left px-4 py-2">Omschrijving</th>
                    <th className="text-right px-4 py-2">Aantal</th>
                    <th className="text-right px-4 py-2">Tarief</th>
                    <th className="text-right px-4 py-2">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(invoice.items || []).map((it, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{it.description}</td>
                      <td className="px-4 py-2 text-right">
                        {Number(it.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {centsToMoney(it.rate_cents)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {centsToMoney(it.amount_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {invoice.status === "draft" && onEdit && (
              <button
                onClick={() => onEdit(invoice)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white hover:opacity-90"
              >
                <Edit className="h-4 w-4" /> Bewerken
              </button>
            )}

            {invoice.status === "draft" && (
              <a
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            )}

            {invoice.status !== "cancelled" && (
              <a
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FileText className="h-4 w-4" /> PDF Preview
              </a>
            )}

            {["draft", "overdue", "sent"].includes(invoice.status) && (
              <button
                onClick={doSend}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
                {working ? "Versturen…" : "Versturen per e-mail"}
              </button>
            )}

            {["sent", "overdue"].includes(invoice.status) && (
              <button
                onClick={doMarkPaid}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white hover:opacity-90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Markeer als betaald
              </button>
            )}

            {invoice.status === "draft" && (
              <button
                onClick={doCancel}
                disabled={working}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
              >
                <XCircle className="h-4 w-4" />
                Annuleren
              </button>
            )}

            <button
              onClick={doCredit}
              disabled={working}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
            >
              <Send className="h-4 w-4" />
              Creditnota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}