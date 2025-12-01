// src/Components/analytics/finance-dashboard.tsx

import React, { useMemo } from "react";
import { PiggyBank, Wallet, Banknote, TrendingUp } from "lucide-react";
import { useFinanceAnalytics } from "./finance-hooks";
import type { FinancialYearReportRow } from "./finance-types";
import { formatEUR, toNum } from "./finance-utils";
import { VatChart, RevenueCostChart } from "./finance-charts";
import { QuarterProjectionPanel } from "./QuarterProjectionPanel";

interface FinanceDashboardProps {
  userId: string | null | undefined;
}

export function FinanceDashboard({ userId }: FinanceDashboardProps) {
  const { reports, isLoading, error } = useFinanceAnalytics(
    userId ?? null
  );

  const {
    lastYear,
    kpis,
    revenueCostData,
    incomeChartHasData,
  } = useMemo(
    () => buildFinanceSummary(reports || []),
    [reports]
  );

  if (!userId) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 text-sm text-[var(--zeus-text-secondary)]">
        Geen gebruiker gevonden – log in om je Finance dashboard te zien.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--zeus-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 text-sm text-red-400">
        Er ging iets mis bij het laden van de financiële gegevens.
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 text-sm text-[var(--zeus-text-secondary)]">
        Nog geen jaarrekeningen gevonden. Voeg eerst jaargegevens toe om je Finance dashboard te gebruiken.
      </div>
    );
  }

  const initialProjectionYear =
    (lastYear && lastYear.year + 1) ||
    new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--zeus-card)] rounded-2xl border border-[var(--zeus-border)] p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="w-6 h-6 text-[var(--zeus-primary)]" />
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--zeus-text)]">
              FINANCE{" "}
              <span className="text-[var(--zeus-primary)]">
                DASHBOARD
              </span>
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[var(--zeus-text-secondary)]">
            Overzicht van je omzet, winst, belasting en vrij besteedbaar inkomen over de jaren – plus een prognose voor het lopende jaar.
          </p>
        </div>

        {lastYear && (
          <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm">
            <span className="text-[var(--zeus-text-secondary)]">
              Laatste jaar in database:
            </span>
            <span className="font-semibold text-[var(--zeus-text)]">
              {lastYear.year} – omzet {formatEUR(kpis.lastYearBruto)} ·
              vrij besteedbaar{" "}
              {formatEUR(kpis.lastVrijBesteedbaar)}
            </span>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<Banknote className="w-5 h-5" />}
          label="Gemiddelde omzet per jaar"
          value={formatEUR(kpis.avgRevenuePerYear)}
          helper={`${kpis.yearsCount} jaar in overzicht`}
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Gemiddelde netto marge"
          value={
            kpis.avgNetMarginPct != null
              ? `${kpis.avgNetMarginPct.toFixed(1)}%`
              : "—"
          }
          helper="Netto winst / omzet"
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="Gemiddelde belastingdruk"
          value={
            kpis.avgTaxRatePct != null
              ? `${kpis.avgTaxRatePct.toFixed(1)}%`
              : "—"
          }
          helper="(IB + Zvw) / belastbaar inkomen"
        />
        <KpiCard
          icon={<PiggyBank className="w-5 h-5" />}
          label="Gemiddeld vrij besteedbaar per jaar"
          value={formatEUR(kpis.avgVrijBesteedbaarPerYear)}
          helper="Na belasting & privé-opnamen"
        />
      </div>

      {/* Inkomens-grafiek (nieuw ipv btw) */}
      <div>
        {incomeChartHasData ? (
          <VatChart data={reports} />
        ) : (
          <div className="bg-[var(--zeus-card)] p-6 rounded-xl border border-[var(--zeus-border)] text-sm text-[var(--zeus-text-secondary)]">
            Er zijn nog niet genoeg belastinggegevens (IB + Zvw) om het inkomensdiagram te tonen.
          </div>
        )}
      </div>

      {/* Omzet vs kosten + tabel per jaar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Omzet vs kosten */}
        <div>
          <RevenueCostChart data={revenueCostData} />
        </div>

        {/* Tabel per jaar */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-[var(--zeus-text)] mb-2">
            Jaaroverzicht
          </h3>
          <p className="text-xs text-[var(--zeus-text-secondary)] mb-4">
            Samenvatting per jaar van omzet, netto, belasting en vrij besteedbaar inkomen.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--zeus-border)] text-[var(--zeus-text-secondary)]">
                  <th className="py-2 pr-2 text-left">Jaar</th>
                  <th className="py-2 pr-2 text-right">Omzet</th>
                  <th className="py-2 pr-2 text-right">
                    Netto vóór belasting
                  </th>
                  <th className="py-2 pr-2 text-right">
                    Belastingen
                  </th>
                  <th className="py-2 pr-2 text-right">
                    Netto na belasting
                  </th>
                  <th className="py-2 pr-0 text-right">
                    Vrij besteedbaar
                  </th>
                </tr>
              </thead>
              <tbody>
                {buildYearRows(reports).map((row) => (
                  <tr
                    key={row.year}
                    className="border-b border-[var(--zeus-border)]/60 last:border-0 hover:bg-[var(--zeus-bg-secondary)]/40 transition-colors"
                  >
                    <td className="py-1.5 pr-2 text-[var(--zeus-text)]">
                      {row.year}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-[var(--zeus-text-secondary)]">
                      {formatEUR(row.bruto)}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-[var(--zeus-text-secondary)]">
                      {formatEUR(row.nettoVoorBelasting)}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-[var(--zeus-text-secondary)]">
                      {row.belastingTotaal != null
                        ? formatEUR(row.belastingTotaal)
                        : "—"}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-[var(--zeus-text-secondary)]">
                      {row.nettoNaBelasting != null
                        ? formatEUR(row.nettoNaBelasting)
                        : "—"}
                    </td>
                    <td className="py-1.5 pr-0 text-right text-[var(--zeus-text-secondary)]">
                      {row.vrijBesteedbaar != null
                        ? formatEUR(row.vrijBesteedbaar)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🔥 Prognose lopend jaar per kwartaal */}
      <QuarterProjectionPanel initialYear={initialProjectionYear} />
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
}

function KpiCard({ icon, label, value, helper }: KpiCardProps) {
  return (
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--zeus-text-secondary)]">
          {label}
        </span>
        <span className="text-[var(--zeus-primary)] opacity-80">
          {icon}
        </span>
      </div>
      <div className="text-lg md:text-xl font-semibold text-[var(--zeus-text)]">
        {value}
      </div>
      {helper && (
        <div className="text-[10px] md:text-xs text-[var(--zeus-text-secondary)]">
          {helper}
        </div>
      )}
    </div>
  );
}

/**
 * Bouwt de samenvattende cijfers voor KPI's en grafieken
 */
function buildFinanceSummary(reports: FinancialYearReportRow[]) {
  if (!reports.length) {
    return {
      lastYear: null as FinancialYearReportRow | null,
      kpis: {
        yearsCount: 0,
        avgRevenuePerYear: 0,
        avgNetMarginPct: null as number | null,
        avgTaxRatePct: null as number | null,
        avgVrijBesteedbaarPerYear: 0,
        lastYearBruto: 0,
        lastVrijBesteedbaar: 0,
      },
      revenueCostData: [] as {
        year: number;
        revenue: number;
        costs: number;
      }[],
      incomeChartHasData: false,
    };
  }

  const sorted = [...reports].sort((a, b) => a.year - b.year);
  const lastYear = sorted[sorted.length - 1];

  const perYear = sorted.map((r) => {
    const tax: any = r.raw_json?.tax || {};
    const bruto = toNum(r.revenue);
    const nettoVoorBelasting = toNum(r.net_profit);
    const incomeTax = toNum(tax.income_tax_due);
    const zvw = toNum(tax.zvw_due);
    const belastingTotaal =
      incomeTax || zvw ? incomeTax + zvw : null;

    const nettoNaBelasting =
      belastingTotaal != null ? nettoVoorBelasting - belastingTotaal : null;

    const vrijBesteedbaar =
      nettoNaBelasting != null
        ? nettoNaBelasting - toNum(r.private_withdrawals)
        : null;

    const taxable = toNum(tax.taxable_income_box1);
    const taxRate =
      taxable > 0 && belastingTotaal != null
        ? belastingTotaal / taxable
        : null;

    const totalCosts =
      toNum(r.cost_of_goods) +
      toNum(r.depreciation) +
      toNum(r.office_costs) +
      toNum(r.vehicle_costs) +
      toNum(r.general_expenses);

    return {
      year: r.year,
      bruto,
      nettoVoorBelasting,
      belastingTotaal,
      nettoNaBelasting,
      vrijBesteedbaar,
      taxRate,
      costs: totalCosts,
    };
  });

  const yearsCount = perYear.length;
  const totalRevenue = perYear.reduce(
    (sum, y) => sum + y.bruto,
    0
  );
  const totalNetto = perYear.reduce(
    (sum, y) => sum + y.nettoVoorBelasting,
    0
  );

  const avgRevenuePerYear =
    yearsCount > 0 ? totalRevenue / yearsCount : 0;
  const avgNetMarginPct =
    totalRevenue > 0 ? (totalNetto / totalRevenue) * 100 : null;

  const taxRates = perYear
    .map((y) => y.taxRate)
    .filter((v): v is number => v != null);
  const avgTaxRatePct =
    taxRates.length > 0
      ? (taxRates.reduce((s, v) => s + v, 0) /
          taxRates.length) *
        100
      : null;

  const vrijBesteedbaarMetWaarde = perYear
    .map((y) => y.vrijBesteedbaar)
    .filter((v): v is number => v != null);
  const avgVrijBesteedbaarPerYear =
    vrijBesteedbaarMetWaarde.length > 0
      ? vrijBesteedbaarMetWaarde.reduce((s, v) => s + v, 0) /
        vrijBesteedbaarMetWaarde.length
      : 0;

  const lastTax: any = lastYear.raw_json?.tax || {};
  const lastIncomeTax = toNum(lastTax.income_tax_due);
  const lastZvw = toNum(lastTax.zvw_due);
  const lastBelastingTotaal =
    lastIncomeTax || lastZvw ? lastIncomeTax + lastZvw : null;
  const lastNettoNaBelasting =
    lastBelastingTotaal != null
      ? toNum(lastYear.net_profit) - lastBelastingTotaal
      : null;
  const lastVrijBesteedbaar =
    lastNettoNaBelasting != null
      ? lastNettoNaBelasting -
        toNum(lastYear.private_withdrawals)
      : 0;

  const revenueCostData = perYear.map((y) => ({
    year: y.year,
    revenue: y.bruto,
    costs: y.costs,
  }));

  const incomeChartHasData = perYear.some(
    (y) => y.belastingTotaal != null
  );

  return {
    lastYear,
    kpis: {
      yearsCount,
      avgRevenuePerYear,
      avgNetMarginPct,
      avgTaxRatePct,
      avgVrijBesteedbaarPerYear,
      lastYearBruto: toNum(lastYear.revenue),
      lastVrijBesteedbaar,
    },
    revenueCostData,
    incomeChartHasData,
  };
}

/**
 * Helper voor tabel-opbouw
 */
function buildYearRows(reports: FinancialYearReportRow[]) {
  const sorted = [...reports].sort((a, b) => a.year - b.year);

  return sorted.map((r) => {
    const tax: any = r.raw_json?.tax || {};
    const bruto = toNum(r.revenue);
    const nettoVoorBelasting = toNum(r.net_profit);
    const incomeTax = toNum(tax.income_tax_due);
    const zvw = toNum(tax.zvw_due);
    const belastingTotaal =
      incomeTax || zvw ? incomeTax + zvw : null;

    const nettoNaBelasting =
      belastingTotaal != null ? nettoVoorBelasting - belastingTotaal : null;

    const vrijBesteedbaar =
      nettoNaBelasting != null
        ? nettoNaBelasting - toNum(r.private_withdrawals)
        : null;

    return {
      year: r.year,
      bruto,
      nettoVoorBelasting,
      belastingTotaal,
      nettoNaBelasting,
      vrijBesteedbaar,
    };
  });
}
