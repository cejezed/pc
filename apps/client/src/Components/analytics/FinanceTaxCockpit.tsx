// src/Components/analytics/FinanceTaxCockpit.tsx

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useFinanceAnalytics } from "./finance-hooks";
import type { FinancialYearReportRow } from "./finance-types";
import { formatEUR, toNum } from "./finance-utils";
import { Banknote, Home, Percent } from "lucide-react";

type TaxOverlayYear = {
  year: number;
  revenue: number;
  netProfit: number;
  privateWithdrawals: number;
  taxableIncome: number | null;
  totalTax: number | null;
  effectiveTaxRate: number | null;
  netAfterTaxAndPrivate: number | null;
  houseWOZ: number | null;
  houseMortgageTotal: number | null;
  houseInterestPaid: number | null;
};

interface FinanceTaxCockpitProps {
  userId: string | null | undefined;
}

export function FinanceTaxCockpit({ userId }: FinanceTaxCockpitProps) {
  const { reports, isLoading, error } = useFinanceAnalytics(userId ?? null);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const overlay: TaxOverlayYear[] = useMemo(
    () => buildTaxOverlay(reports),
    [reports]
  );

  if (!userId) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 text-sm text-[var(--zeus-text-secondary)]">
        Geen gebruiker gevonden – log in om je Finance &amp; Tax cockpit te zien.
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

  if (error || !reports.length || !overlay.length) {
    return (
      <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 text-sm text-red-400">
        Er ging iets mis bij het laden van de financiële gegevens of er zijn
        nog geen jaarrekeningen gevonden.
      </div>
    );
  }

  // Eén keer sorteren, overal hergebruiken
  const sortedOverlay = overlay.slice().sort((a, b) => a.year - b.year);
  const years = sortedOverlay.map((o) => o.year);

  const currentYear: number =
    selectedYear && years.includes(selectedYear)
      ? selectedYear
      : years[years.length - 1];

  const currentIndex = sortedOverlay.findIndex((o) => o.year === currentYear);
  const current: TaxOverlayYear =
    sortedOverlay[currentIndex] ?? sortedOverlay[sortedOverlay.length - 1];

  const previous: TaxOverlayYear | null =
    currentIndex > 0 ? sortedOverlay[currentIndex - 1] : null;

  const mainChartData = sortedOverlay.map((o) => ({
    year: o.year,
    winst: o.netProfit,
    belasting: o.totalTax ?? 0,
    netto: o.netAfterTaxAndPrivate ?? 0,
  }));

  const taxPressureData = sortedOverlay.map((o) => ({
    year: o.year,
    belastingdruk: (o.effectiveTaxRate ?? 0) * 100,
    priveOpnamen: o.privateWithdrawals,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--zeus-card)] rounded-2xl border border-[var(--zeus-border)] p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="w-6 h-6 text-[var(--zeus-primary)]" />
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-[var(--zeus-text)]">
              FINANCE &amp; TAX{" "}
              <span className="text-[var(--zeus-primary)]">COCKPIT</span>
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[var(--zeus-text-secondary)]">
            Eén overzicht voor omzet, winst, belastingdruk, privé-opnamen en je
            huis.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <label className="text-xs text-[var(--zeus-text-secondary)]">
            Geselecteerd jaar
          </label>
          <select
            value={currentYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--zeus-text-secondary)]">
            Omzet {formatEUR(current.revenue)} · Netto na belasting{" "}
            {current.netAfterTaxAndPrivate != null
              ? formatEUR(current.netAfterTaxAndPrivate)
              : "—"}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Omzet"
          value={formatEUR(current.revenue)}
          helper={
            previous
              ? `Vorig jaar: ${formatEUR(previous.revenue)}`
              : undefined
          }
        />
        <KpiCard
          label="Netto winst (voor privé)"
          value={formatEUR(current.netProfit)}
          helper={
            current.revenue
              ? `Marge: ${Math.round(
                  (current.netProfit / current.revenue) * 100
                )}%`
              : undefined
          }
        />
        <KpiCard
          label="Totale belasting"
          value={
            current.totalTax != null ? formatEUR(current.totalTax) : "—"
          }
          helper={
            current.effectiveTaxRate != null
              ? `Belastingdruk: ${Math.round(
                  current.effectiveTaxRate * 100
                )}%`
              : undefined
          }
        />
        <KpiCard
          label="Netto na belasting & privé"
          value={
            current.netAfterTaxAndPrivate != null
              ? formatEUR(current.netAfterTaxAndPrivate)
              : "—"
          }
          helper={
            current.privateWithdrawals
              ? `Privé-opnamen: ${formatEUR(current.privateWithdrawals)}`
              : undefined
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Winst / belasting / netto */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-2">
            Winst, belasting en netto per jaar
          </h3>
          <p className="text-xs text-[var(--zeus-text-secondary)] mb-4">
            Geeft de verhouding tussen winst, belasting en wat er netto
            overblijft.
          </p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mainChartData}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="winst"
                  name="Netto winst"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="belasting"
                  name="Belasting"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="netto"
                  name="Netto na belasting & privé"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Belastingdruk & privé-opnamen */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)] mb-2">
            Belastingdruk en privé-opnamen
          </h3>
          <p className="text-xs text-[var(--zeus-text-secondary)] mb-4">
            Hoeveel procent gaat naar belasting, en hoeveel haal je privé uit je
            bedrijf?
          </p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taxPressureData}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="priveOpnamen"
                  name="Privé-opnamen"
                  fill="#e11d48"
                />
                <Line
                  type="monotone"
                  dataKey="belastingdruk"
                  name="Belastingdruk (%)"
                  stroke="#facc15"
                  strokeWidth={2}
                  yAxisId={0}
                  dot={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* House & tax summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* House card */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Home className="w-4 h-4 text-[var(--zeus-primary)]" />
            <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)]">
              Woning &amp; hypotheek ({currentYear})
            </h3>
          </div>
          {current.houseWOZ == null &&
          current.houseMortgageTotal == null &&
          current.houseInterestPaid == null ? (
            <p className="text-xs text-[var(--zeus-text-secondary)]">
              Geen woninggegevens beschikbaar voor dit jaar in de aangifte.
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs md:text-sm">
              <div>
                <dt className="text-[var(--zeus-text-secondary)]">
                  WOZ-waarde
                </dt>
                <dd className="font-medium text-[var(--zeus-text)]">
                  {current.houseWOZ != null
                    ? formatEUR(current.houseWOZ)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--zeus-text-secondary)]">
                  Hypotheekschuld
                </dt>
                <dd className="font-medium text-[var(--zeus-text)]">
                  {current.houseMortgageTotal != null
                    ? formatEUR(current.houseMortgageTotal)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--zeus-text-secondary)]">
                  Betaalde rente
                </dt>
                <dd className="font-medium text-[var(--zeus-text)]">
                  {current.houseInterestPaid != null
                    ? formatEUR(current.houseInterestPaid)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--zeus-text-secondary)]">
                  Loan-to-value (globaal)
                </dt>
                <dd className="font-medium text-[var(--zeus-text)]">
                  {current.houseWOZ && current.houseMortgageTotal
                    ? `${Math.round(
                        (current.houseMortgageTotal / current.houseWOZ) * 100
                      )}%`
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {/* Tax insights */}
        <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="w-4 h-4 text-[var(--zeus-primary)]" />
            <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)]">
              Coach-inzichten {currentYear}
            </h3>
          </div>
          <TaxInsightsBlock current={current} previous={previous} />
        </div>
      </div>
    </div>
  );
}

/**
 * Bouwt per jaar een overlay van finance + tax + huis
 */
function buildTaxOverlay(
  reports: FinancialYearReportRow[]
): TaxOverlayYear[] {
  return reports.map((r) => {
    const revenue = toNum(r.revenue);
    const netProfit = toNum(r.net_profit);
    const privateWithdrawals = toNum(r.private_withdrawals);

    const raw: any = r.raw_json || {};
    const tax = raw.tax || {};
    const house = raw.house || {};

    const taxableIncome: number | null =
      typeof tax.taxable_income_box1 === "number"
        ? tax.taxable_income_box1
        : null;

    const incomeTax: number | null =
      typeof tax.income_tax_due === "number" ? tax.income_tax_due : null;

    const zvw: number | null =
      typeof tax.zvw_due === "number" ? tax.zvw_due : null;

    const totalTax: number | null =
      incomeTax != null && zvw != null
        ? incomeTax + zvw
        : incomeTax ?? zvw ?? null;

    let effectiveTaxRate: number | null = null;
    if (typeof tax.effective_tax_rate === "number") {
      effectiveTaxRate = tax.effective_tax_rate;
    } else if (totalTax != null && taxableIncome && taxableIncome !== 0) {
      effectiveTaxRate = totalTax / taxableIncome;
    }

    const netAfterTaxAndPrivate: number | null =
      totalTax != null ? netProfit - totalTax - privateWithdrawals : null;

    const mortgages: { principal?: number; interest_paid?: number }[] =
      Array.isArray(house.mortgages) ? house.mortgages : [];

    const houseMortgageTotal: number | null =
      mortgages.length > 0
        ? mortgages.reduce(
            (sum, m) => sum + (m.principal ?? 0),
            0
          )
        : null;

    const houseInterestPaid: number | null =
      mortgages.length > 0
        ? mortgages.reduce(
            (sum, m) => sum + (m.interest_paid ?? 0),
            0
          )
        : null;

    const houseWOZ: number | null =
      typeof house.woz === "number" ? house.woz : null;

    return {
      year: r.year,
      revenue,
      netProfit,
      privateWithdrawals,
      taxableIncome,
      totalTax,
      effectiveTaxRate,
      netAfterTaxAndPrivate,
      houseWOZ,
      houseMortgageTotal,
      houseInterestPaid,
    };
  });
}

interface KpiCardProps {
  label: string;
  value: string;
  helper?: string;
}

function KpiCard({ label, value, helper }: KpiCardProps) {
  return (
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 shadow-sm">
      <div className="text-xs text-[var(--zeus-text-secondary)] mb-1">
        {label}
      </div>
      <div className="text-lg md:text-xl font-semibold text-[var(--zeus-text)] mb-1">
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

interface TaxInsightsBlockProps {
  current: TaxOverlayYear;
  previous: TaxOverlayYear | null;
}

/**
 * Simpele, data-gedreven coachtekst (zonder LLM)
 */
function TaxInsightsBlock({ current, previous }: TaxInsightsBlockProps) {
  const bullets: string[] = [];

  const delta = (now: number, prev: number | null): number | null => {
    if (prev == null || prev === 0) return null;
    return Math.round(((now - prev) / prev) * 100);
  };

  if (previous) {
    const revDelta = delta(current.revenue, previous.revenue);
    if (revDelta != null) {
      if (revDelta > 5) {
        bullets.push(
          `Je omzet ligt ongeveer ${revDelta}% hoger dan in ${previous.year}.`
        );
      } else if (revDelta < -5) {
        bullets.push(
          `Je omzet ligt ongeveer ${Math.abs(
            revDelta
          )}% lager dan in ${previous.year}.`
        );
      } else {
        bullets.push(
          `Je omzet ligt grofweg op hetzelfde niveau als in ${previous.year} (±${Math.abs(
            revDelta
          )}%).`
        );
      }
    }

    if (current.totalTax != null && previous.totalTax != null) {
      const taxDelta = delta(current.totalTax, previous.totalTax);
      if (taxDelta != null) {
        if (taxDelta > 5) {
          bullets.push(
            `Je totale belastingdruk in euro's is ongeveer ${taxDelta}% hoger dan vorig jaar.`
          );
        } else if (taxDelta < -5) {
          bullets.push(
            `Je totale belastingdruk in euro's is ongeveer ${Math.abs(
              taxDelta
            )}% lager dan vorig jaar.`
          );
        }
      }
    }
  }

  if (current.effectiveTaxRate != null) {
    const ratePct = Math.round(current.effectiveTaxRate * 100);
    if (ratePct >= 40) {
      bullets.push(
        `Je effectieve belastingdruk ligt rond de ${ratePct}%. Dat is stevig; het loont om te kijken of je aftrekken en timing optimaal benut.`
      );
    } else if (ratePct <= 25) {
      bullets.push(
        `Je effectieve belastingdruk ligt rond de ${ratePct}%. Dat is relatief laag, waarschijnlijk door ondernemersaftrek en MKB-vrijstelling.`
      );
    } else {
      bullets.push(
        `Je effectieve belastingdruk ligt rond de ${ratePct}%. Dat is een gemiddeld niveau voor je inkomenscategorie.`
      );
    }
  }

  if (current.revenue > 0 && current.privateWithdrawals > 0) {
    const ratio = Math.round(
      (current.privateWithdrawals / current.revenue) * 100
    );
    if (ratio >= 60) {
      bullets.push(
        `Je privé-opnamen zijn ongeveer ${ratio}% van je omzet. Dit is aan de hoge kant; check of je buffer en investeringsruimte nog comfortabel zijn.`
      );
    } else if (ratio <= 30) {
      bullets.push(
        `Je privé-opnamen zijn ongeveer ${ratio}% van je omzet. Je laat relatief veel in de zaak, wat goed kan zijn voor buffer of investeringen.`
      );
    } else {
      bullets.push(
        `Je privé-opnamen zijn ongeveer ${ratio}% van je omzet. Dat is een redelijk gebalanceerd niveau.`
      );
    }
  }

  if (
    current.houseWOZ != null &&
    current.houseMortgageTotal != null &&
    current.houseWOZ > 0
  ) {
    const ltv = Math.round(
      (current.houseMortgageTotal / current.houseWOZ) * 100
    );
    if (ltv <= 50) {
      bullets.push(
        `Je loan-to-value op de woning ligt rond de ${ltv}%. Dat geeft relatief veel overwaarde en flexibiliteit.`
      );
    } else if (ltv >= 80) {
      bullets.push(
        `Je loan-to-value op de woning ligt rond de ${ltv}%. Dat is aan de hoge kant; houd hier rekening mee bij grote investeringen of tegenvallers.`
      );
    } else {
      bullets.push(
        `Je loan-to-value op de woning ligt rond de ${ltv}%. Dat is een prima middenmoot qua risico.`
      );
    }
  }

  return (
    <div className="space-y-2 text-xs md:text-sm text-[var(--zeus-text-secondary)]">
      <p className="text-[var(--zeus-text)] mb-2">
        In {current.year} draaide je ongeveer{" "}
        <strong>{formatEUR(current.revenue)}</strong> omzet, met een netto winst
        (vóór privé) van{" "}
        <strong>{formatEUR(current.netProfit)}</strong>. Je haalde{" "}
        <strong>{formatEUR(current.privateWithdrawals)}</strong> privé uit de
        zaak.
      </p>

      {current.totalTax != null && (
        <p>
          Aan inkomstenbelasting en Zvw betaalde je in totaal ongeveer{" "}
          <strong>{formatEUR(current.totalTax)}</strong>
          {current.effectiveTaxRate != null && (
            <>
              {" "}
              (ongeveer{" "}
              <strong>
                {Math.round(current.effectiveTaxRate * 100)}%
              </strong>{" "}
              van je belastbare inkomen).
            </>
          )}
        </p>
      )}

      {bullets.length > 0 ? (
        <ul className="mt-2 space-y-1 list-disc pl-4">
          {bullets.map((b, idx) => (
            <li key={idx}>{b}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">
          Op basis van de beschikbare cijfers zijn er geen grote uitschieters
          ten opzichte van vorig jaar – je zit in een redelijk stabiel patroon.
        </p>
      )}
    </div>
  );
}
