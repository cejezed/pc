// src/Components/analytics/finance-dashboard.tsx

import React, { useMemo, useState } from "react";
import { FinanceKpis } from "./finance-kpis";
import {
  RevenueChart,
  CostStructureChart,
  PrivateWithdrawalsChart,
  VatYearChart,
  CostCategory,
} from "./finance-charts";
import { useFinanceAnalytics } from "./finance-hooks";
import type { FinancialYearReportRow } from "./finance-types";
import { formatEUR, toNum } from "./finance-utils";

interface FinanceDashboardProps {
  userId: string | null;
}

export function FinanceDashboard({ userId }: FinanceDashboardProps) {
  const {
    reports,
    revenueSeries,
    costSeries,
    privateSeries,
    vatSeries,
    isLoading,
    error,
  } = useFinanceAnalytics(userId);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCostCategory, setSelectedCostCategory] =
    useState<CostCategory | null>(null);

  const vatYearData = useMemo(() => {
    const map = new Map<
      number,
      { year: number; Q1: number; Q2: number; Q3: number; Q4: number }
    >();

    vatSeries.forEach((item) => {
      const existing =
        map.get(item.year) || { year: item.year, Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

      if (item.quarter === "Q1") existing.Q1 = item.amount;
      if (item.quarter === "Q2") existing.Q2 = item.amount;
      if (item.quarter === "Q3") existing.Q3 = item.amount;
      if (item.quarter === "Q4") existing.Q4 = item.amount;

      map.set(item.year, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [vatSeries]);

  const tableRows = useMemo(
    () => buildSummaryTable(reports),
    [reports]
  );

  const selectedReport: FinancialYearReportRow | undefined = useMemo(() => {
    if (!reports.length) return undefined;
    if (!selectedYear) return reports[reports.length - 1];
    return (
      reports.find((r) => r.year === selectedYear) ??
      reports[reports.length - 1]
    );
  }, [reports, selectedYear]);

  if (!userId) {
    return (
      <p className="text-sm text-[var(--zeus-text-secondary)]">
        Geen gebruiker gevonden – log in om je financiële overzicht te zien.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-6 h-6 border-2 border-[var(--zeus-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-400">
        Fout bij laden financiële data:{" "}
        {error instanceof Error ? error.message : String(error)}
      </p>
    );
  }

  if (!reports.length || !selectedReport) {
    return (
      <p className="text-sm text-[var(--zeus-text-secondary)]">
        Nog geen jaarrekeningen gevonden in{" "}
        <code>financial_year_reports</code>.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI's bovenaan (op basis van geselecteerd jaar) */}
      <FinanceKpis selected={selectedReport} />

      {/* 4 grafieken in twee rijen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Omzet & winst */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-4 border-b border-[var(--zeus-border)] pb-2">
            Omzet & winst per jaar{" "}
            <span className="text-[var(--zeus-text-secondary)] text-xs">
              (klik op een jaar voor details)
            </span>
          </h3>
          <RevenueChart
            data={revenueSeries}
            onSelectYear={(year) => {
              setSelectedYear(year);
              setSelectedCostCategory(null);
            }}
          />
        </div>

        {/* Kostenstructuur */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-4 border-b border-[var(--zeus-border)] pb-2">
            Kostenstructuur per jaar{" "}
            <span className="text-[var(--zeus-text-secondary)] text-xs">
              (klik op een balk voor uitsplitsing)
            </span>
          </h3>
          <CostStructureChart
            data={costSeries}
            onSelectCost={(year, category) => {
              setSelectedYear(year);
              setSelectedCostCategory(category);
            }}
          />
        </div>

        {/* Privé-opnamen */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-4 border-b border-[var(--zeus-border)] pb-2">
            Privé-opnamen per jaar
          </h3>
          <PrivateWithdrawalsChart data={privateSeries} />
        </div>

        {/* BTW per jaar (gestapeld per kwartaal) */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-4 border-b border-[var(--zeus-border)] pb-2">
            Afgedragen BTW per jaar (Q1–Q4)
          </h3>
          <VatYearChart data={vatYearData} />
        </div>
      </div>

      {/* Detailpaneel: geselecteerd jaar + kostensoort */}
      <DetailPanel
        report={selectedReport}
        selectedYear={selectedReport.year}
        selectedCostCategory={selectedCostCategory}
      />

      {/* Coach-blok: tekstuele inzichten op basis van data */}
      <InsightsPanel
        reports={reports}
        selectedYear={selectedReport.year}
      />

      {/* Tabel met jaaroverzicht */}
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] overflow-hidden shadow-sm">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[var(--zeus-border)] bg-[var(--zeus-bg-secondary)]">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)]">
            Jaaroverzicht (omzet, winst, kosten, privé-opnamen)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--zeus-border)]">
                <th className="p-3 md:p-4 font-semibold text-[var(--zeus-text-secondary)]">
                  Jaar
                </th>
                <th className="p-3 md:p-4 font-semibold text-[var(--zeus-text-secondary)]">
                  Omzet
                </th>
                <th className="p-3 md:p-4 font-semibold text-[var(--zeus-text-secondary)]">
                  Netto winst
                </th>
                <th className="p-3 md:p-4 font-semibold text-[var(--zeus-text-secondary)]">
                  Totale kosten
                </th>
                <th className="p-3 md:p-4 font-semibold text-[var(--zeus-text-secondary)]">
                  Winstmarge
                </th>
                <th className="p-3 md:p-4 font-semibold text-[var(--zeus-text-secondary)]">
                  Privé-opnamen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--zeus-border)]">
              {tableRows.map((row) => (
                <tr
                  key={row.year}
                  className="hover:bg-[var(--zeus-bg-secondary)]/40 cursor-pointer"
                  onClick={() => {
                    setSelectedYear(row.year);
                    setSelectedCostCategory(null);
                  }}
                >
                  <td className="p-3 md:p-4 text-[var(--zeus-text)] font-medium">
                    {row.year}
                  </td>
                  <td className="p-3 md:p-4 text-[var(--zeus-text-secondary)]">
                    {formatEUR(row.revenue)}
                  </td>
                  <td className="p-3 md:p-4 text-[var(--zeus-text-secondary)]">
                    {formatEUR(row.netProfit)}
                  </td>
                  <td className="p-3 md:p-4 text-[var(--zeus-text-secondary)]">
                    {formatEUR(row.totalCosts)}
                  </td>
                  <td className="p-3 md:p-4 text-[var(--zeus-text-secondary)]">
                    {row.profitMargin != null ? `${row.profitMargin}%` : "–"}
                  </td>
                  <td className="p-3 md:p-4 text-[var(--zeus-text-secondary)]">
                    {formatEUR(row.privateWithdrawals)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function buildSummaryTable(reports: FinancialYearReportRow[]) {
  return reports.map((r) => {
    const revenue = toNum(r.revenue);
    const netProfit = toNum(r.net_profit);

    const salesCosts =
      r.raw_json?.cost_details?.sales_costs?.reduce(
        (sum, item) => sum + item.amount,
        0
      ) ?? 0;

    const totalCosts =
      toNum(r.office_costs) +
      toNum(r.vehicle_costs) +
      toNum(r.general_expenses) +
      salesCosts;

    const profitMargin =
      revenue > 0 ? Math.round((netProfit / revenue) * 100) : null;

    return {
      year: r.year,
      revenue,
      netProfit,
      totalCosts,
      profitMargin,
      privateWithdrawals: toNum(r.private_withdrawals),
    };
  });
}

interface DetailPanelProps {
  report?: FinancialYearReportRow;
  selectedYear: number | null;
  selectedCostCategory: CostCategory | null;
}

function DetailPanel({
  report,
  selectedYear,
  selectedCostCategory,
}: DetailPanelProps) {
  if (!report || !selectedYear) return null;

  const revenue = toNum(report.revenue);
  const netProfit = toNum(report.net_profit);

  const salesCosts =
    report.raw_json?.cost_details?.sales_costs?.reduce(
      (sum, item) => sum + item.amount,
      0
    ) ?? 0;

  const totalCosts =
    toNum(report.office_costs) +
    toNum(report.vehicle_costs) +
    toNum(report.general_expenses) +
    salesCosts;

  const profitMargin =
    revenue > 0 ? Math.round((netProfit / revenue) * 100) : null;

  const vat = report.raw_json?.vat;
  const costDetails = report.raw_json?.cost_details;

  const categoryMap: Record<
    CostCategory,
    {
      label: string;
      items?: { label: string; amount: number }[];
      total: number;
    }
  > = {
    office: {
      label: "Kantoorkosten",
      items: costDetails?.office_costs,
      total: toNum(report.office_costs),
    },
    vehicle: {
      label: "Autokosten",
      items: costDetails?.vehicle_costs,
      total: toNum(report.vehicle_costs),
    },
    sales: {
      label: "Verkoopkosten",
      items: costDetails?.sales_costs,
      total: salesCosts,
    },
    general: {
      label: "Algemene kosten",
      items: costDetails?.general_expenses,
      total: toNum(report.general_expenses),
    },
  };

  const selectedCategoryMeta =
    selectedCostCategory != null
      ? categoryMap[selectedCostCategory]
      : null;

  return (
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-2">
            Jaar {selectedYear} – detailoverzicht
          </h3>
          <p className="text-xs md:text-sm text-[var(--zeus-text-secondary)] mb-4">
            Klikte je op een grafiek of rij, dan zie je hier de bijbehorende
            details.
          </p>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-xs md:text-sm">
            <div>
              <dt className="text-[var(--zeus-text-secondary)]">Omzet</dt>
              <dd className="font-medium text-[var(--zeus-text)]">
                {formatEUR(revenue)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--zeus-text-secondary)]">Netto winst</dt>
              <dd className="font-medium text-[var(--zeus-text)]">
                {formatEUR(netProfit)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--zeus-text-secondary)]">
                Totale kosten
              </dt>
              <dd className="font-medium text-[var(--zeus-text)]">
                {formatEUR(totalCosts)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--zeus-text-secondary)]">Winstmarge</dt>
              <dd className="font-medium text-[var(--zeus-text)]">
                {profitMargin != null ? `${profitMargin}%` : "–"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--zeus-text-secondary)]">
                Privé-opnamen
              </dt>
              <dd className="font-medium text-[var(--zeus-text)]">
                {formatEUR(toNum(report.private_withdrawals))}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--zeus-text-secondary)]">
                BTW te betalen
              </dt>
              <dd className="font-medium text-[var(--zeus-text)]">
                {vat?.vat_payable != null
                  ? formatEUR(vat.vat_payable)
                  : "–"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Kostensoort detail */}
        {selectedCategoryMeta && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[var(--zeus-border)] pt-4 md:pt-0 md:pl-4">
            <h4 className="text-sm font-semibold text-[var(--zeus-text)] mb-2">
              {selectedCategoryMeta.label} – uitsplitsing
            </h4>
            <p className="text-xs text-[var(--zeus-text-secondary)] mb-2">
              Totaal:{" "}
              <span className="font-semibold">
                {formatEUR(selectedCategoryMeta.total)}
              </span>
            </p>
            {selectedCategoryMeta.items &&
            selectedCategoryMeta.items.length > 0 ? (
              <ul className="space-y-1 max-h-48 overflow-auto pr-2 text-xs">
                {selectedCategoryMeta.items.map((item, idx) => (
                  <li
                    key={`${item.label}-${idx}`}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[var(--zeus-text)]">
                      {item.label}
                    </span>
                    <span className="text-[var(--zeus-text-secondary)]">
                      {formatEUR(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[var(--zeus-text-secondary)]">
                Geen sub-specificatie beschikbaar voor deze kostensoort in dit
                jaar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface InsightsPanelProps {
  reports: FinancialYearReportRow[];
  selectedYear: number | null;
}

/**
 * Simpele "AI-achtige" coach: genereert tekstuele inzichten op basis van
 * trends in de data (zonder echte LLM-call).
 */
function InsightsPanel({ reports, selectedYear }: InsightsPanelProps) {
  if (!reports.length) return null;

  const sorted = [...reports].sort((a, b) => a.year - b.year);
  const current =
    selectedYear != null
      ? sorted.find((r) => r.year === selectedYear) ?? sorted[sorted.length - 1]
      : sorted[sorted.length - 1];

  const idx = sorted.findIndex((r) => r.year === current.year);
  const prev = idx > 0 ? sorted[idx - 1] : undefined;

  const revenue = toNum(current.revenue);
  const netProfit = toNum(current.net_profit);
  const privateWithdrawals = toNum(current.private_withdrawals);

  const salesCosts =
    current.raw_json?.cost_details?.sales_costs?.reduce(
      (sum, item) => sum + item.amount,
      0
    ) ?? 0;

  const totalCosts =
    toNum(current.office_costs) +
    toNum(current.vehicle_costs) +
    toNum(current.general_expenses) +
    salesCosts;

  const profitMargin =
    revenue > 0 ? Math.round((netProfit / revenue) * 100) : null;

  const prevRevenue = prev ? toNum(prev.revenue) : null;
  const prevProfit = prev ? toNum(prev.net_profit) : null;
  const prevCosts =
    prev &&
    (toNum(prev.office_costs) +
      toNum(prev.vehicle_costs) +
      toNum(prev.general_expenses) +
      (prev.raw_json?.cost_details?.sales_costs?.reduce(
        (sum, item) => sum + item.amount,
        0
      ) ?? 0));

  const delta = (currentValue: number, prevValue: number | null) => {
    if (!prevValue || prevValue === 0) return null;
    const diff = ((currentValue - prevValue) / prevValue) * 100;
    return Math.round(diff);
  };

  const revenueDelta = prevRevenue != null ? delta(revenue, prevRevenue) : null;
  const profitDelta = prevProfit != null ? delta(netProfit, prevProfit) : null;
  const costDelta =
    prevCosts != null ? delta(totalCosts, prevCosts) : null;

  const bullets: string[] = [];

  if (revenueDelta != null) {
    if (revenueDelta > 5)
      bullets.push(
        `Je omzet ligt ongeveer ${revenueDelta}% hoger dan vorig jaar. Dat is een duidelijke groeitrend.`
      );
    else if (revenueDelta < -5)
      bullets.push(
        `Je omzet ligt ongeveer ${Math.abs(
          revenueDelta
        )}% lager dan vorig jaar. Dit is een goed moment om te kijken welke projecten of klanten zijn weggevallen.`
      );
    else
      bullets.push(
        `Je omzet ligt rond hetzelfde niveau als vorig jaar (±${Math.abs(
          revenueDelta
        )}%).`
      );
  }

  if (profitDelta != null) {
    if (profitDelta > 5)
      bullets.push(
        `Je winst is relatief sterker gegroeid dan je omzet (ongeveer ${profitDelta}% ten opzichte van vorig jaar).`
      );
    else if (profitDelta < -5)
      bullets.push(
        `Je winst is ongeveer ${Math.abs(
          profitDelta
        )}% gedaald, ook als de omzet redelijk stabiel is. Controleer je kostenstructuur en tarieven.`
      );
  }

  if (costDelta != null) {
    if (costDelta > 10)
      bullets.push(
        `Je totale kosten zijn ongeveer ${costDelta}% gestegen. Bekijk vooral kantoor-, auto- en algemene kosten op kansen om te besparen.`
      );
    else if (costDelta < -5)
      bullets.push(
        `Je totale kosten zijn gedaald ten opzichte van vorig jaar (ongeveer ${Math.abs(
          costDelta
        )}%). Dat geeft extra ruimte in je marge.`
      );
  }

  if (profitMargin != null && profitMargin < 30) {
    bullets.push(
      `Je winstpercentage ligt rond de ${profitMargin}%. Voor een eenmansarchitectenbureau zou je idealiter richting de 35–40% willen zitten.`
    );
  } else if (profitMargin != null && profitMargin >= 40) {
    bullets.push(
      `Je winstpercentage ligt rond de ${profitMargin}%. Dat is stevig – er is ruimte om te investeren in betere processen, marketing of het uitbesteden van repetitief werk.`
    );
  }

  if (privateWithdrawals > 0 && revenue > 0) {
    const withdrawRatio = Math.round(
      (privateWithdrawals / revenue) * 100
    );
    bullets.push(
      `Je privé-opnamen zijn ongeveer ${withdrawRatio}% van je omzet. Check of dit past bij je gewenste buffer en investeringsdoelen.`
    );
  }

  const yearLabel = current.year;

  return (
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
      <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-2">
        Coach-inzichten voor {yearLabel}
      </h3>
      <p className="text-xs md:text-sm text-[var(--zeus-text-secondary)] mb-3">
        Dit blok vat de belangrijkste signalen samen op basis van je cijfers. Zie
        het als een snelle jaarlijkse review.
      </p>

      <div className="text-xs md:text-sm space-y-1">
        <p className="text-[var(--zeus-text)]">
          In {yearLabel} draaide je ongeveer{" "}
          <strong>{formatEUR(revenue)}</strong> omzet, met een netto winst van{" "}
          <strong>{formatEUR(netProfit)}</strong> en totale kosten rond{" "}
          <strong>{formatEUR(totalCosts)}</strong>.
        </p>
      </div>

      {bullets.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs md:text-sm text-[var(--zeus-text-secondary)] list-disc pl-5">
          {bullets.map((b, idx) => (
            <li key={idx}>{b}</li>
          ))}
        </ul>
      )}

      {bullets.length === 0 && (
        <p className="mt-3 text-xs md:text-sm text-[var(--zeus-text-secondary)]">
          Op basis van de beschikbare jaren zijn er geen opvallende signalen –
          je cijfers bewegen redelijk stabiel ten opzichte van vorig jaar.
        </p>
      )}
    </div>
  );
}
