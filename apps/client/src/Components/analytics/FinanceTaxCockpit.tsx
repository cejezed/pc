// src/Components/analytics/FinanceTaxCockpit.tsx
//
// "Definance cockpit" – jaaroverzicht van winst, belasting en netto
// op basis van financial_year_reports + tax-engine.
//
// - Haalt alle jaarrekeningen op via useFinanceAnalytics
// - Laat je een jaar kiezen
// - Toont KPI's voor dat jaar (omzet, winst, belasting, netto)
// - Toont multi-year grafiek (omzet / winst / netto na belasting)
// - Alles reageert op wijziging van het gekozen jaar

import React, { useMemo, useState } from "react";
import { BarChart3, Calendar, Info } from "lucide-react";
import { useFinanceAnalytics } from "./finance-hooks";
import type { FinancialYearReportRow } from "./finance-types";
import {
  computeTaxForYear,
  getDefaultTaxYearParams,
} from "./tax-engine";
import { getProfileForYear } from "./tax-profiles";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type EnrichedYearRow = {
  year: number;
  revenue: number;
  profit: number;
  tax: number; // IB + Zvw
  netAfterTax: number;
  effectiveRate: number;
};

function toNumber(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function formatEUR(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

interface FinanceTaxCockpitProps {
  /** Ingelogde gebruiker (auth user id). */
  userId: string | null | undefined;
  /** Optioneel: initieel jaar forceren (bijv. huidig jaar) */
  initialYear?: number;
}

export const FinanceTaxCockpit: React.FC<FinanceTaxCockpitProps> = ({
  userId,
  initialYear,
}) => {
  // Geen user → geen cockpit
  if (!userId) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 text-sm text-[var(--zeus-text-secondary)]">
        Geen gebruiker gevonden – log in om je belastingcockpit te zien.
      </div>
    );
  }

  // Haal jaarrekeningen + tax-json op via dezelfde hook als het FinanceDashboard
  const { reports, isLoading, error } = useFinanceAnalytics(userId ?? null);

  // Bepaal beschikbare jaren op basis van de reports
  const availableYears = useMemo(() => {
    const years = (reports || [])
      .map((r) => r.year)
      .filter((y): y is number => typeof y === "number")
      .sort((a, b) => a - b);
    return Array.from(new Set(years));
  }, [reports]);

  const defaultYear =
    initialYear ??
    (availableYears.length
      ? availableYears[availableYears.length - 1]
      : new Date().getFullYear());

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  // Verrijk de ruwe Supabase-rows met belasting via tax-engine
  const enriched = useMemo<EnrichedYearRow[]>(() => {
    if (!reports || reports.length === 0) return [];

    return reports
      .map((r: FinancialYearReportRow) => {
        const year = r.year;
        const revenue = toNumber(r.revenue);
        const profit = toNumber(r.net_profit); // winst uit onderneming (voor IB)

        if (!year || profit <= 0) {
          return {
            year: year || 0,
            revenue,
            profit,
            tax: 0,
            netAfterTax: profit,
            effectiveRate: 0,
          };
        }

        const params = getDefaultTaxYearParams(year);
        const profile = getProfileForYear(year);

        const taxResult = computeTaxForYear(
          {
            year,
            businessProfit: profit,
            profile: profile ?? undefined,
          },
          params
        );

        const tax = taxResult.totalTax; // IB + Zvw
        const netAfterTax = profit - tax;
        const effectiveRate = profit > 0 ? tax / profit : 0;

        return {
          year,
          revenue,
          profit,
          tax,
          netAfterTax,
          effectiveRate,
        };
      })
      .filter((row) => row.year > 0)
      .sort((a, b) => a.year - b.year);
  }, [reports]);

  // Geselecteerde jaarregels
  const selectedRow = useMemo(() => {
    return enriched.find((r) => r.year === selectedYear) ?? null;
  }, [enriched, selectedYear]);

  // Zorg dat selectedYear altijd een geldig jaar is als data verandert
  React.useEffect(() => {
    if (!availableYears.length) return;
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(
        initialYear && availableYears.includes(initialYear)
          ? initialYear
          : availableYears[availableYears.length - 1]
      );
    }
  }, [availableYears, selectedYear, initialYear]);

  const multiYearChartData = useMemo(() => {
    return enriched.map((r) => ({
      year: String(r.year),
      omzet: r.revenue,
      winst: r.profit,
      netto: r.netAfterTax,
    }));
  }, [enriched]);

  if (isLoading) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--zeus-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-red-500/50 p-4 text-sm text-red-200">
        Er ging iets mis bij het ophalen van de jaarcijfers.
      </div>
    );
  }

  if (!enriched.length) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 text-sm text-[var(--zeus-text-secondary)]">
        Nog geen jaarrekeningen gevonden. Voeg eerst financial_year_reports toe in Supabase.
      </div>
    );
  }

  return (
    <div className="bg-[var(--zeus-card)] rounded-2xl border border-[var(--zeus-border)] p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--zeus-bg-secondary)] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[var(--zeus-primary)]" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-[var(--zeus-text)]">
              Belasting & Netto Overzicht
            </h2>
            <p className="text-xs text-[var(--zeus-text-secondary)]">
              Vergelijk per jaar je omzet, winst, belasting en netto resultaat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--zeus-primary)]" />
          <select
            className="px-3 py-1.5 rounded-lg bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] text-xs md:text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI's voor gekozen jaar */}
      {selectedRow && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPIBlock
            label="Omzet"
            value={formatEUR(selectedRow.revenue)}
            subtitle={`Jaar ${selectedRow.year}`}
          />
          <KPIBlock
            label="Winst (voor IB)"
            value={formatEUR(selectedRow.profit)}
            subtitle="Winst uit onderneming"
          />
          <KPIBlock
            label="Totale belasting (IB + Zvw)"
            value={formatEUR(selectedRow.tax)}
            subtitle={`${Math.round(selectedRow.effectiveRate * 100)}% van de winst`}
          />
          <KPIBlock
            label="Netto na belasting"
            value={formatEUR(selectedRow.netAfterTax)}
            subtitle="Indicatief vrij besteedbaar"
          />
        </div>
      )}

      {/* Multi-year grafiek */}
      <div className="bg-[var(--zeus-bg-secondary)]/40 rounded-xl border border-[var(--zeus-border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--zeus-text)]">
              Ontwikkeling omzet, winst & netto
            </h3>
            <p className="text-xs text-[var(--zeus-text-secondary)]">
              Laat zien hoe je bedrijfsresultaten zich ontwikkelen over de jaren, inclusief een
              schatting van het netto resultaat na belasting.
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiYearChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="year" stroke="rgba(255,255,255,0.6)" />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tickFormatter={(v) =>
                  new Intl.NumberFormat("nl-NL", {
                    maximumFractionDigits: 0,
                  }).format(v)
                }
              />
              <Tooltip
                formatter={(v: number) => formatEUR(v)}
                labelFormatter={(label) => `Jaar ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="omzet"
                name="Omzet"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="winst"
                name="Winst"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="netto"
                name="Netto na belasting"
                stroke="#eab308"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Uitleg */}
      <div className="flex items-start gap-2 text-[10px] md:text-xs text-[var(--zeus-text-secondary)]">
        <Info className="w-3 h-3 mt-0.5 text-[var(--zeus-primary)]" />
        <p>
          De belastingbedragen zijn een benadering op basis van jouw winst uit onderneming, de
          gekozen jaarparameters en eventuele persoonlijke profielen (woning, aftrekposten). Dit is
          bedoeld als cockpit voor planning, niet als officiële aangifte.
        </p>
      </div>
    </div>
  );
};

interface KPIBlockProps {
  label: string;
  value: string;
  subtitle?: string;
}

function KPIBlock({ label, value, subtitle }: KPIBlockProps) {
  return (
    <div className="bg-[var(--zeus-bg-secondary)]/60 rounded-xl border border-[var(--zeus-border)] px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-[var(--zeus-text-secondary)]">{label}</span>
      <span className="text-sm md:text-base font-semibold text-[var(--zeus-text)]">
        {value}
      </span>
      {subtitle && (
        <span className="text-[10px] text-[var(--zeus-text-secondary)]">{subtitle}</span>
      )}
    </div>
  );
}

export default FinanceTaxCockpit;
