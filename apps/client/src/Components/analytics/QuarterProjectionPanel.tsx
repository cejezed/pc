// src/Components/analytics/QuarterProjectionPanel.tsx
//
// UI-paneel om per kwartaal inkomsten & uitgaven in te voeren,
// en direct te zien:
// - geprojecteerde jaarwinst
// - IB + Zvw (incl. heffingskortingen, woning, aftrek via profiel)
// - effectieve belastingdruk
// - alerts als je richting ~50% belastingdruk gaat.

import React, { useMemo, useState } from "react";
import { Calendar, AlertTriangle, Info } from "lucide-react";
import {
  getDefaultTaxYearParams,
  projectTaxFromQuarters,
  QuarterProjectionResult,
} from "./tax-engine";
import { buildTaxAlertsFromProjection, TaxAlert } from "./finance-alerts";
import { getProfileForYear } from "./tax-profiles";

interface QuarterProjectionPanelProps {
  /** Optionele initiele jaarwaarde, bv. laatste jaar + 1 of huidig jaar */
  initialYear?: number;
}

type QuarterState = {
  income: number;
  expenses: number;
};

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"];

export function QuarterProjectionPanel({ initialYear }: QuarterProjectionPanelProps) {
  const now = new Date();
  const defaultYear = initialYear || now.getFullYear();

  // Simpel startpunt: huidige jaar & lege kwartalen
  const [year, setYear] = useState<number>(defaultYear);
  const [currentQuarter, setCurrentQuarter] = useState<number>(1);
  const [quarters, setQuarters] = useState<QuarterState[]>([
    { income: 0, expenses: 0 },
    { income: 0, expenses: 0 },
    { income: 0, expenses: 0 },
    { income: 0, expenses: 0 },
  ]);

  const params = useMemo(() => getDefaultTaxYearParams(year), [year]);
  const profile = useMemo(() => getProfileForYear(year), [year]);

  const projection: QuarterProjectionResult | null = useMemo(() => {
    try {
      return projectTaxFromQuarters(
        {
          year,
          currentQuarter,
          quarters,
          profile: profile ?? undefined,
        },
        params
      );
    } catch {
      return null;
    }
  }, [year, currentQuarter, quarters, profile, params]);

  const alerts: TaxAlert[] = useMemo(
    () => buildTaxAlertsFromProjection(projection, params),
    [projection, params]
  );

  const ytdIncome = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < currentQuarter; i++) {
      sum += quarters[i]?.income || 0;
    }
    return sum;
  }, [quarters, currentQuarter]);

  const ytdExpenses = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < currentQuarter; i++) {
      sum += quarters[i]?.expenses || 0;
    }
    return sum;
  }, [quarters, currentQuarter]);

  const handleQuarterChange = (index: number, field: keyof QuarterState, value: string) => {
    const numeric = parseFloat(value.replace(",", "."));
    const safe = isNaN(numeric) ? 0 : numeric;
    setQuarters((prev) => {
      const next = prev.slice();
      const q = { ...next[index] };
      q[field] = safe;
      next[index] = q;
      return next;
    });
  };

  const yearOptions = buildYearOptions(defaultYear);

  return (
    <div className="bg-[var(--zeus-card)] rounded-xl border border-[var(--zeus-border)] p-4 md:p-6 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[var(--zeus-primary)]" />
            <h3 className="text-sm md:text-base font-semibold text-[var(--zeus-text)]">
              Prognose lopend jaar (per kwartaal)
            </h3>
          </div>
          <p className="text-xs text-[var(--zeus-text-secondary)]">
            Vul per kwartaal je omzet en kosten in en zie direct de geprojecteerde jaarwinst en
            belastingdruk (IB + Zvw). Dit is een benadering voor planning, geen officiële aangifte.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--zeus-text-secondary)]">Jaar</label>
            <select
              value={year}
              onChange={(e) => {
                const y = parseInt(e.target.value, 10);
                setYear(isNaN(y) ? defaultYear : y);
              }}
              className="px-3 py-1.5 bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] rounded-lg text-xs md:text-sm text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)]"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 md:ml-2">
            {QUARTER_LABELS.map((label, idx) => {
              const q = idx + 1;
              const active = q === currentQuarter;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCurrentQuarter(q)}
                  className={[
                    "px-2 py-1 rounded text-xs border transition-all",
                    active
                      ? "bg-[var(--zeus-primary)] text-black border-[var(--zeus-primary)]"
                      : "bg-[var(--zeus-bg-secondary)] text-[var(--zeus-text-secondary)] border-[var(--zeus-border)] hover:border-[var(--zeus-primary)]/60",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kwartaal invoer + samenvatting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kwartaal invoer */}
        <div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--zeus-border)] text-[var(--zeus-text-secondary)]">
                <th className="py-1.5 pr-2 text-left">Kwartaal</th>
                <th className="py-1.5 pr-2 text-right">Omzet</th>
                <th className="py-1.5 pr-0 text-right">Kosten</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q, idx) => {
                const quarterLabel = QUARTER_LABELS[idx];
                return (
                  <tr
                    key={quarterLabel}
                    className="border-b border-[var(--zeus-border)]/60 last:border-0"
                  >
                    <td className="py-1.5 pr-2 text-[var(--zeus-text)]">{quarterLabel}</td>
                    <td className="py-1.5 pr-2 text-right">
                      <input
                        type="number"
                        inputMode="decimal"
                        className="w-full text-right px-2 py-1 rounded bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] text-xs"
                        value={q.income || ""}
                        onChange={(e) => handleQuarterChange(idx, "income", e.target.value)}
                      />
                    </td>
                    <td className="py-1.5 pr-0 text-right">
                      <input
                        type="number"
                        inputMode="decimal"
                        className="w-full text-right px-2 py-1 rounded bg-[var(--zeus-bg-secondary)] border border-[var(--zeus-border)] text-[var(--zeus-text)] focus:outline-none focus:border-[var(--zeus-primary)] text-xs"
                        value={q.expenses || ""}
                        onChange={(e) => handleQuarterChange(idx, "expenses", e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-2 text-[10px] text-[var(--zeus-text-secondary)]">
            Tip: begin met schattingen voor komende kwartalen. Naarmate het jaar vordert vul je de
            werkelijke cijfers in voor een scherpere prognose.
          </div>
        </div>

        {/* Samenvatting rechts */}
        <div className="flex flex-col gap-3">
          <SummaryRow
            label={`Omzet t/m ${QUARTER_LABELS[currentQuarter - 1]}`}
            value={formatEUR(ytdIncome)}
          />
          <SummaryRow
            label={`Kosten t/m ${QUARTER_LABELS[currentQuarter - 1]}`}
            value={formatEUR(ytdExpenses)}
          />
          <SummaryRow
            label="Winst t/m nu (YTD)"
            value={formatEUR((projection && projection.yearToDateProfit) || 0)}
          />
          <div className="h-px bg-[var(--zeus-border)] my-1" />
          <SummaryRow
            label="Geprojecteerde jaarwinst"
            value={formatEUR((projection && projection.projectedYearProfit) || 0)}
            strong
          />
          <SummaryRow
            label="Inkomstenbelasting (indicatie)"
            value={formatEUR((projection && projection.incomeTax) || 0)}
          />
          <SummaryRow
            label="Zvw-bijdrage (indicatie)"
            value={formatEUR((projection && projection.zvwContribution) || 0)}
          />
          <SummaryRow
            label="Totale belasting (IB + Zvw)"
            value={formatEUR((projection && projection.totalTax) || 0)}
          />
          <SummaryRow
            label="Effectieve belastingdruk"
            value={
              projection ? `${Math.round(projection.effectiveTaxRate * 100)}%` : "—"
            }
          />
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mt-2 space-y-2">
          {alerts.map((a) => (
            <AlertBadge key={a.id} alert={a} />
          ))}
        </div>
      )}

      {alerts.length === 0 && projection && projection.businessProfit > 0 && (
        <div className="mt-2 flex items-start gap-2 text-[10px] md:text-xs text-[var(--zeus-text-secondary)]">
          <Info className="w-3 h-3 mt-0.5 text-[var(--zeus-primary)]" />
          <p>
            Op basis van je huidige invoer lijkt je belastingdruk stabiel en zijn er geen opvallende
            drempels. Als je cijfers wijzigen, kun je hier snel opnieuw checken wat dat betekent.
          </p>
        </div>
      )}
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  strong?: boolean;
}

function SummaryRow({ label, value, strong }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between text-xs md:text-sm">
      <span className="text-[var(--zeus-text-secondary)]">{label}</span>
      <span
        className={
          strong ? "font-semibold text-[var(--zeus-text)]" : "text-[var(--zeus-text)]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function AlertBadge({ alert }: { alert: TaxAlert }) {
  const colorClasses =
    alert.level === "critical"
      ? "bg-red-900/40 border-red-500/50 text-red-200"
      : alert.level === "warning"
      ? "bg-yellow-900/30 border-yellow-500/50 text-yellow-100"
      : "bg-[var(--zeus-bg-secondary)] border-[var(--zeus-border)] text-[var(--zeus-text-secondary)]";

  const Icon = alert.level === "info" ? Info : AlertTriangle;

  return (
    <div
      className={[
        "flex items-start gap-2 px-3 py-2 rounded-lg border text-[10px] md:text-xs",
        colorClasses,
      ].join(" ")}
    >
      <Icon className="w-3 h-3 mt-0.5 shrink-0" />
      <div>
        <div className="font-semibold mb-0.5">{alert.title}</div>
        <div>{alert.description}</div>
      </div>
    </div>
  );
}

function buildYearOptions(defaultYear: number): number[] {
  const years: number[] = [];
  // Laatste 3 jaar + huidig + volgende 2 jaar
  for (let y = defaultYear - 3; y <= defaultYear + 2; y++) {
    years.push(y);
  }
  return years;
}

function formatEUR(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
