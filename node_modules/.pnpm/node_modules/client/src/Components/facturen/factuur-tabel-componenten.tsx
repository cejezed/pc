import React, { useMemo, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Download,
  Mail,
  Trash2,
} from "lucide-react";
import { StatusBadge, centsToMoney } from "./basis-componenten";
import { fmtDate, parseDate } from "./hooks";
import { api } from "@/lib/api";
import type { Invoice } from "./types";

type Sort = {
  key: keyof Invoice | "client";
  dir: "asc" | "desc";
};

export function InvoicesTable({
  invoices,
  filterStatus,
  search,
  dateRange,
  onRowClick,
  onDelete
}: {
  invoices: Invoice[];
  filterStatus: "all" | Invoice["status"];
  search: string;
  dateRange: { from: string; to: string };
  onRowClick: (inv: Invoice) => void;
  onDelete: (inv: Invoice) => void;
}) {
  const [sort, setSort] = useState<Sort>({ key: "invoice_date", dir: "desc" });

  const filtered = useMemo(() => {
    let list = invoices.slice();

    if (filterStatus !== "all") {
      list = list.filter((i) => i.status === filterStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(q) ||
          (i.project?.name || "").toLowerCase().includes(q) ||
          (i.project?.client_name || "").toLowerCase().includes(q)
      );
    }

    if (dateRange.from) {
      const from = parseDate(dateRange.from)!;
      list = list.filter((i) => parseDate(i.invoice_date)! >= from);
    }

    if (dateRange.to) {
      const to = parseDate(dateRange.to)!;
      list = list.filter((i) => parseDate(i.invoice_date)! <= to);
    }

    list.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      let av: any = a[sort.key as keyof Invoice];
      let bv: any = b[sort.key as keyof Invoice];

      if (sort.key === "client") {
        av = a.project?.client_name || "";
        bv = b.project?.client_name || "";
      }

      if (sort.key === "amount_cents") {
        return (av - bv) * dir;
      }

      return String(av).localeCompare(String(bv)) * dir;
    });

    return list;
  }, [invoices, filterStatus, search, dateRange, sort]);

  const header = (key: Sort["key"], label: string) => {
    const active = sort.key === key;
    const dirIcon =
      active && sort.dir === "asc" ? (
        <ChevronUp className="h-3 w-3" />
      ) : active && sort.dir === "desc" ? (
        <ChevronDown className="h-3 w-3" />
      ) : null;

    return (
      <button
        className="inline-flex items-center gap-1"
        onClick={() =>
          setSort((s) =>
            s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
          )
        }
      >
        {label} {dirIcon}
      </button>
    );
  };

  return (
    <div className="overflow-auto border rounded-xl">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2">
              {header("invoice_number", "Factuurnummer")}
            </th>
            <th className="text-left px-4 py-2">
              {header("client", "Klant / Project")}
            </th>
            <th className="text-left px-4 py-2">
              {header("invoice_date", "Datum")}
            </th>
            <th className="text-left px-4 py-2">
              {header("due_date", "Vervaldatum")}
            </th>
            <th className="text-right px-4 py-2">
              {header("amount_cents", "Bedrag")}
            </th>
            <th className="text-left px-4 py-2">
              {header("status", "Status")}
            </th>
            <th className="px-4 py-2 text-right">Acties</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filtered.map((i) => (
            <tr key={i.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <button
                  onClick={() => onRowClick(i)}
                  className="text-black underline-offset-2 hover:underline"
                >
                  {i.invoice_number}
                </button>
              </td>
              <td className="px-4 py-2">
                <div className="font-medium">{i.project?.client_name || "—"}</div>
                <div className="text-gray-600">{i.project?.name || "—"}</div>
              </td>
              <td className="px-4 py-2">{fmtDate(i.invoice_date)}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  {fmtDate(i.due_date)}
                  {i.status === "overdue" && (
                    <span
                      className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500"
                      title="Overdue"
                    />
                  )}
                </div>
              </td>
              <td className="px-4 py-2 text-right">{centsToMoney(i.amount_cents)}</td>
              <td className="px-4 py-2">
                <StatusBadge status={i.status} />
              </td>
              <td className="px-4 py-2">
                <div className="flex justify-end gap-2">
                  <a
                    className="p-2 rounded hover:bg-gray-100"
                    href={`/api/invoices/${i.id}/pdf`}
                    title="PDF downloaden"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    className="p-2 rounded hover:bg-gray-100"
                    title="Versturen per e-mail"
                    onClick={async () => {
                      await api(`/api/invoices/${i.id}/send`, { method: "POST" });
                      alert("Verzonden.");
                    }}
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 rounded hover:bg-red-50"
                    title="Verwijderen"
                    onClick={() => onDelete(i)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!filtered.length && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-600">
                Geen facturen gevonden met deze filter(s).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
