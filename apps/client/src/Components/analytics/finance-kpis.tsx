// components/analytics/finance-kpis.tsx

import { formatEUR, toNum } from "./finance-utils";

export function FinanceKpis({ selected }) {
  if (!selected) return null;

  const salesCosts =
    selected.raw_json?.cost_details?.sales_costs?.reduce(
      (s, i) => s + (i.amount ?? 0),
      0
    ) ?? 0;

  const totalCosts =
    toNum(selected.office_costs) +
    toNum(selected.vehicle_costs) +
    toNum(selected.general_expenses) +
    salesCosts;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Kpi label="Omzet" value={formatEUR(toNum(selected.revenue))} />
      <Kpi label="Winst" value={formatEUR(toNum(selected.net_profit))} />
      <Kpi label="Totale kosten" value={formatEUR(totalCosts)} />
      <Kpi label="Privé-opnamen" value={formatEUR(toNum(selected.private_withdrawals))} />
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 border border-slate-200">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
